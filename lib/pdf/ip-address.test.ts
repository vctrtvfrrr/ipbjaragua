import { describe, expect, it } from 'vitest'
import { isPublicIpAddress } from './ip-address'

describe('isPublicIpAddress', () => {
  it('accepts addresses on the open internet', () => {
    expect(isPublicIpAddress('93.184.216.34')).toBe(true)
    expect(isPublicIpAddress('2001:4860:4860::8888')).toBe(true)
  })

  it.each([
    ['0.0.0.0'],
    ['10.1.2.3'],
    ['100.64.0.1'],
    ['127.0.0.1'],
    ['169.254.169.254'],
    ['172.16.0.1'],
    ['172.31.255.255'],
    ['192.168.1.1'],
    ['198.18.0.1'],
    ['224.0.0.1'],
    ['255.255.255.255'],
  ])('refuses the reserved IPv4 address %s', (address) => {
    expect(isPublicIpAddress(address)).toBe(false)
  })

  it.each([
    ['::'],
    ['::1'],
    ['fc00::1'],
    ['fd00::1'],
    ['fe80::1'],
    ['ff02::1'],
    ['2001::1'],
    ['2001:db8::1'],
    ['3fff::1'],
  ])('refuses the reserved IPv6 address %s', (address) => {
    expect(isPublicIpAddress(address)).toBe(false)
  })

  it.each([['100:0:0:1::1'], ['4000::1'], ['5f00::1'], ['64:ff9b::c0a8:1'], ['::ffff:93.184.216.34']])(
    'refuses %s because it sits outside allocated global unicast',
    (address) => {
      expect(isPublicIpAddress(address)).toBe(false)
    }
  )

  it('refuses an IPv6 address that tunnels to a private IPv4 destination', () => {
    expect(isPublicIpAddress('2002:a9fe:a9fe::1')).toBe(false)
    expect(isPublicIpAddress('2002:5db8:d822::1')).toBe(true)
  })

  it('refuses anything that is not an address', () => {
    expect(isPublicIpAddress('example.com')).toBe(false)
    expect(isPublicIpAddress('999.1.1.1')).toBe(false)
  })
})
