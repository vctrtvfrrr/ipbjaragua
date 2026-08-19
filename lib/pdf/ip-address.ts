import { isIP } from 'node:net'

type Range = { prefix: string; bits: number }

// Everything the IANA registries mark as anything other than "globally reachable".
// A renderer that follows a Markdown image URL is a request forgery primitive, so the
// question is never "is this address dangerous" but "is it provably on the open internet".
const RESERVED_V4: Range[] = [
  { prefix: '0.0.0.0', bits: 8 },
  { prefix: '10.0.0.0', bits: 8 },
  { prefix: '100.64.0.0', bits: 10 },
  { prefix: '127.0.0.0', bits: 8 },
  { prefix: '169.254.0.0', bits: 16 },
  { prefix: '172.16.0.0', bits: 12 },
  { prefix: '192.0.0.0', bits: 24 },
  { prefix: '192.0.2.0', bits: 24 },
  { prefix: '192.88.99.0', bits: 24 },
  { prefix: '192.168.0.0', bits: 16 },
  { prefix: '198.18.0.0', bits: 15 },
  { prefix: '198.51.100.0', bits: 24 },
  { prefix: '203.0.113.0', bits: 24 },
  { prefix: '224.0.0.0', bits: 4 },
  { prefix: '240.0.0.0', bits: 4 },
]

const RESERVED_V6: Range[] = [
  { prefix: '::', bits: 128 },
  { prefix: '::1', bits: 128 },
  { prefix: '100::', bits: 64 },
  { prefix: '2001::', bits: 23 },
  { prefix: '2001:db8::', bits: 32 },
  { prefix: 'fc00::', bits: 7 },
  { prefix: 'fe80::', bits: 10 },
  { prefix: 'ff00::', bits: 8 },
]

// Transition formats carry an IPv4 destination inside an IPv6 address, so the address is
// only as public as the address it embeds.
const V4_INSIDE_V6: Range[] = [
  { prefix: '::ffff:0:0', bits: 96 },
  { prefix: '64:ff9b::', bits: 96 },
  { prefix: '64:ff9b:1::', bits: 48 },
  { prefix: '2002::', bits: 16 },
]

export function isPublicIpAddress(address: string): boolean {
  const version = isIP(address)
  if (version === 4) return isPublicV4(parseV4(address))
  if (version === 6) return isPublicV6(address)
  return false
}

function isPublicV4(octets: number[] | null): boolean {
  if (!octets) return false
  return !RESERVED_V4.some((range) => matchesV4(octets, range))
}

function isPublicV6(address: string): boolean {
  const groups = parseV6(address)
  if (!groups) return false
  if (RESERVED_V6.some((range) => matchesV6(groups, range))) return false

  const embedded = V4_INSIDE_V6.find((range) => matchesV6(groups, range))
  if (!embedded) return true

  const offset = embedded.prefix === '2002::' ? 1 : 6
  return isPublicV4([groups[offset] >> 8, groups[offset] & 0xff, groups[offset + 1] >> 8, groups[offset + 1] & 0xff])
}

function parseV4(address: string): number[] | null {
  const octets = address.split('.').map(Number)
  return octets.length === 4 && octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255)
    ? octets
    : null
}

function matchesV4(octets: number[], range: Range): boolean {
  const value = octets.reduce((acc, octet) => acc * 256 + octet, 0)
  const prefix = parseV4(range.prefix)!.reduce((acc, octet) => acc * 256 + octet, 0)
  const mask = range.bits === 0 ? 0 : (0xffffffff << (32 - range.bits)) >>> 0

  return (value & mask) >>> 0 === (prefix & mask) >>> 0
}

export function parseV6(address: string): number[] | null {
  if (isIP(address) !== 6) return null

  const [head, tail] = address.split('::') as [string, string | undefined]
  const parse = (part: string) => (part ? part.split(':') : [])
  const trailing = parse(tail ?? '')
  const leading = parse(head)

  // A trailing dotted quad ("::ffff:127.0.0.1") stands for the last two groups.
  const last = trailing.at(-1) ?? leading.at(-1)
  const dotted = last?.includes('.') ? parseV4(last) : null
  if (dotted) {
    const replacement = [((dotted[0] << 8) | dotted[1]).toString(16), ((dotted[2] << 8) | dotted[3]).toString(16)]
    ;(trailing.length ? trailing : leading).splice(-1, 1, ...replacement)
  }

  const filler = new Array(Math.max(0, 8 - leading.length - trailing.length)).fill('0')
  const groups = (tail === undefined ? leading : [...leading, ...filler, ...trailing]).map((group) =>
    parseInt(group, 16)
  )

  return groups.length === 8 && groups.every((group) => Number.isInteger(group)) ? groups : null
}

function matchesV6(groups: number[], range: Range): boolean {
  const prefix = parseV6(range.prefix)!

  for (let index = 0; index < 8; index++) {
    const bits = Math.min(16, Math.max(0, range.bits - index * 16))
    if (bits === 0) break

    const mask = (0xffff << (16 - bits)) & 0xffff
    if ((groups[index] & mask) !== (prefix[index] & mask)) return false
  }

  return true
}
