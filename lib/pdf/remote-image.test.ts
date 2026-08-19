import { createServer, request as httpRequest, type Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  fetchRemoteImageDataUri,
  MAX_REMOTE_IMAGE_BYTES,
  publicOnlyLookup,
  type RemoteImageTransport,
} from './remote-image'

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex')

let server: Server
let origin: string

type Reply = { status?: number; headers?: Record<string, string>; body?: Buffer | string }

const replies = new Map<string, Reply>()

beforeAll(async () => {
  server = createServer((request, response) => {
    const reply = replies.get(request.url ?? '') ?? { status: 404 }
    response.writeHead(reply.status ?? 200, reply.headers ?? {})
    response.end(reply.body ?? '')
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  origin = `http://safe.test:${typeof address === 'object' && address ? address.port : 0}`
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
})

// The loopback server stands in for a public HTTPS host: only "safe.test" is treated as a
// public name, so every other destination the test reaches for goes through the real guard.
const transport: RemoteImageTransport = {
  request: httpRequest as unknown as RemoteImageTransport['request'],
  protocol: 'http:',
  lookup: (hostname, options, callback) =>
    hostname === 'safe.test'
      ? options.all
        ? callback(null, [{ address: '127.0.0.1', family: 4 }])
        : callback(null, '127.0.0.1', 4)
      : publicOnlyLookup(hostname, options, callback),
}

function serve(path: string, reply: Reply): string {
  replies.set(path, reply)
  return `${origin}${path}`
}

describe('fetchRemoteImageDataUri', () => {
  it('inlines the image bytes as a data URI', async () => {
    const url = serve('/logo.png', { headers: { 'content-type': 'image/png' }, body: PNG })

    expect(await fetchRemoteImageDataUri(url, transport)).toBe(`data:image/png;base64,${PNG.toString('base64')}`)
  })

  it('accepts only HTTPS addresses', async () => {
    await expect(fetchRemoteImageDataUri('http://example.com/logo.png')).rejects.toThrow(
      'somente endereços HTTPS públicos são aceitos'
    )
    await expect(fetchRemoteImageDataUri('not-a-url')).rejects.toThrow('o endereço é inválido')
  })

  it.each([
    ['https://127.0.0.1/logo.png'],
    ['https://10.0.0.5/logo.png'],
    ['https://169.254.169.254/latest/meta-data'],
    ['https://[::1]/logo.png'],
    ['https://[fd00::1]/logo.png'],
  ])('refuses the literal private address %s, which never reaches a DNS lookup', async (url) => {
    await expect(fetchRemoteImageDataUri(url)).rejects.toThrow('o destino não é um endereço público')
  })

  it('refuses a redirect to a literal private address', async () => {
    const url = serve('/literal.png', { status: 302, headers: { location: 'http://127.0.0.1/logo.png' } })

    await expect(fetchRemoteImageDataUri(url, transport)).rejects.toThrow('o destino não é um endereço público')
  })

  it('refuses a name that resolves to a private address', async () => {
    const url = serve('/private.png', { headers: { 'content-type': 'image/png' }, body: PNG })

    await expect(
      fetchRemoteImageDataUri(url.replace('safe.test', 'localhost'), { ...transport, lookup: publicOnlyLookup })
    ).rejects.toThrow('o destino não é um endereço público')
  })

  it('refuses a redirect that leaves the allowed protocol', async () => {
    const url = serve('/upgrade.png', { status: 302, headers: { location: 'https://safe.test/logo.png' } })

    await expect(fetchRemoteImageDataUri(url, transport)).rejects.toThrow(
      'somente endereços HTTPS públicos são aceitos'
    )
  })

  it('refuses a redirect that lands on a private address', async () => {
    const url = serve('/rebind.png', {
      status: 302,
      headers: { location: `${origin.replace('safe.test', 'localhost')}/logo.png` },
    })

    await expect(fetchRemoteImageDataUri(url, transport)).rejects.toThrow('o destino não é um endereço público')
  })

  it('gives up on a redirect loop', async () => {
    const url = serve('/loop.png', { status: 302, headers: { location: `${origin}/loop.png` } })

    await expect(fetchRemoteImageDataUri(url, transport)).rejects.toThrow('há redirecionamentos demais')
  })

  it('refuses a response that is not an accepted image type', async () => {
    const url = serve('/page.html', { headers: { 'content-type': 'text/html' }, body: '<p>não</p>' })

    await expect(fetchRemoteImageDataUri(url, transport)).rejects.toThrow('não é uma imagem aceita')
  })

  it('refuses an image that declares more bytes than the limit', async () => {
    const url = serve('/huge.png', {
      headers: { 'content-type': 'image/png', 'content-length': String(MAX_REMOTE_IMAGE_BYTES + 1) },
      body: PNG,
    })

    await expect(fetchRemoteImageDataUri(url, transport)).rejects.toThrow('excede o tamanho máximo')
  })

  it('refuses an image that outgrows the limit while it streams', async () => {
    const url = serve('/growing.png', {
      headers: { 'content-type': 'image/png' },
      body: Buffer.alloc(MAX_REMOTE_IMAGE_BYTES + 1024),
    })

    await expect(fetchRemoteImageDataUri(url, transport)).rejects.toThrow('excede o tamanho máximo')
  })

  it('reports a server that refuses the image', async () => {
    const url = serve('/missing.png', { status: 404 })

    await expect(fetchRemoteImageDataUri(url, transport)).rejects.toThrow('o servidor respondeu 404')
  })
})
