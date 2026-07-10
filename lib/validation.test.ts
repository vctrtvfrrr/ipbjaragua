import { describe, expect, it } from 'vitest'
import { nullableTrimmedString, requiredTrimmedString } from './validation'

describe('shared string schemas', () => {
  it('normalizes blank optional values to null', () => {
    expect(nullableTrimmedString.parse('   ')).toBeNull()
    expect(nullableTrimmedString.parse(undefined)).toBeNull()
    expect(nullableTrimmedString.parse('  texto  ')).toBe('texto')
  })

  it('rejects blank required values with the supplied message', () => {
    const result = requiredTrimmedString('Informe o valor').safeParse('  ')

    expect(result.error?.issues[0]?.message).toBe('Informe o valor')
  })
})
