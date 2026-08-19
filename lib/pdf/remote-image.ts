import { lookup as dnsLookup } from 'node:dns'
import type { IncomingMessage } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { isPublicIpAddress } from './ip-address'

export const REMOTE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif'] as const

export const MAX_REMOTE_IMAGE_BYTES = 4 * 1024 * 1024

const MAX_REDIRECTS = 3
const REQUEST_TIMEOUT_MS = 10_000

export class RemoteImageError extends Error {
  constructor(
    readonly url: string,
    reason: string
  ) {
    super(`Não foi possível carregar a imagem ${url}: ${reason}`)
    this.name = 'RemoteImageError'
  }
}

type Lookup = NonNullable<Parameters<typeof httpsRequest>[1]['lookup']>

// The transport is a seam: production only ever speaks HTTPS to a public address, and the
// tests drive the redirect, content-type and size rules against a loopback HTTP server.
export type RemoteImageTransport = {
  request: typeof httpsRequest
  protocol: 'https:' | 'http:'
  lookup: Lookup
}

const DEFAULT_TRANSPORT: RemoteImageTransport = {
  request: httpsRequest,
  protocol: 'https:',
  lookup: publicOnlyLookup,
}

export async function fetchRemoteImageDataUri(
  rawUrl: string,
  transport: RemoteImageTransport = DEFAULT_TRANSPORT
): Promise<string> {
  const url = parseUrl(rawUrl, transport.protocol)
  const { contentType, body } = await download(url, transport, 0)

  return `data:${contentType};base64,${body.toString('base64')}`
}

function parseUrl(rawUrl: string, protocol: string): URL {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new RemoteImageError(rawUrl, 'o endereço é inválido')
  }

  if (url.protocol !== protocol) throw new RemoteImageError(rawUrl, 'somente endereços HTTPS públicos são aceitos')
  return url
}

// Resolution and connection share one answer, so a name that resolves to a public address
// during the check and to a private one a moment later never gets a second chance.
export function publicOnlyLookup(
  hostname: string,
  options: Parameters<Lookup>[1],
  callback: Parameters<Lookup>[2]
): void {
  dnsLookup(hostname, { ...(options as object), all: true }, (error, addresses) => {
    if (error) return callback(error, '', 0)

    const allowed = addresses.filter((address) => isPublicIpAddress(address.address))
    if (allowed.length === 0) return callback(new Error('PRIVATE_ADDRESS'), '', 0)

    // Node asks for every address when it races address families, and hands the whole
    // answer to the socket: filtering has to happen here or the socket picks a rejected one.
    if (options.all) return callback(null, allowed)

    callback(null, allowed[0].address, allowed[0].family)
  })
}

async function download(
  url: URL,
  transport: RemoteImageTransport,
  redirects: number
): Promise<{ contentType: string; body: Buffer }> {
  const response = await send(url, transport)
  const location = response.headers.location

  if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && location) {
    response.resume()
    if (redirects >= MAX_REDIRECTS) throw new RemoteImageError(url.href, 'há redirecionamentos demais')

    return download(parseUrl(new URL(location, url).href, transport.protocol), transport, redirects + 1)
  }

  if (response.statusCode !== 200) {
    response.resume()
    throw new RemoteImageError(url.href, `o servidor respondeu ${response.statusCode}`)
  }

  const contentType = (response.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()
  if (!REMOTE_IMAGE_TYPES.includes(contentType as (typeof REMOTE_IMAGE_TYPES)[number])) {
    response.resume()
    throw new RemoteImageError(url.href, `o tipo ${contentType || 'desconhecido'} não é uma imagem aceita`)
  }

  const declared = Number(response.headers['content-length'])
  if (declared > MAX_REMOTE_IMAGE_BYTES) {
    response.resume()
    throw new RemoteImageError(url.href, 'a imagem excede o tamanho máximo')
  }

  return { contentType, body: await collect(response, url) }
}

function send(url: URL, transport: RemoteImageTransport): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const request = transport.request(
      url,
      { lookup: transport.lookup, headers: { accept: 'image/*' }, timeout: REQUEST_TIMEOUT_MS },
      resolve
    )

    request.on('timeout', () => request.destroy(new Error('TIMEOUT')))
    request.on('error', (error) => reject(translate(url, error)))
    request.end()
  })
}

function collect(response: IncomingMessage, url: URL): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0

    response.on('data', (chunk: Buffer) => {
      size += chunk.byteLength
      if (size > MAX_REMOTE_IMAGE_BYTES) {
        response.destroy()
        return reject(new RemoteImageError(url.href, 'a imagem excede o tamanho máximo'))
      }
      chunks.push(chunk)
    })
    response.on('error', (error) => reject(translate(url, error)))
    response.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

function translate(url: URL, error: Error): RemoteImageError {
  if (error.message === 'PRIVATE_ADDRESS') return new RemoteImageError(url.href, 'o destino não é um endereço público')
  if (error.message === 'TIMEOUT') return new RemoteImageError(url.href, 'o servidor não respondeu a tempo')

  return new RemoteImageError(url.href, 'o servidor está inacessível')
}
