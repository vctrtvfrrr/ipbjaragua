import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MOMENT_TYPES } from '@/lib/liturgy'

const css = readFileSync(join(__dirname, 'globals.css'), 'utf8')
const root = css.slice(css.indexOf(':root {'), css.indexOf('.dark {'))

function token(name: string) {
  const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(root)
  if (!match) throw new Error(`--${name} is not defined in :root`)
  return match[1].trim()
}

function srgbToLinear(channel: number) {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

// OKLCH → OKLab → LMS → linear sRGB, per Björn Ottosson's reference matrices.
function oklchToLinearRgb(l: number, c: number, hue: number) {
  const a = c * Math.cos((hue * Math.PI) / 180)
  const b = c * Math.sin((hue * Math.PI) / 180)
  const lms = [
    l + 0.3963377774 * a + 0.2158037573 * b,
    l - 0.1055613458 * a - 0.0638541728 * b,
    l - 0.0894841775 * a - 1.291485548 * b,
  ].map((value) => value ** 3)
  return [
    4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2],
    -1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2],
    -0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2],
  ].map((value) => Math.min(1, Math.max(0, value)))
}

function luminance(color: string) {
  const oklch = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(color)
  const [r, g, b] = oklch
    ? oklchToLinearRgb(Number(oklch[1]), Number(oklch[2]), Number(oklch[3]))
    : [1, 3, 5].map((i) => srgbToLinear(parseInt(color.slice(i, i + 2), 16) / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

describe('contrast measurement', () => {
  it('agrees with the ratios already documented for the brand palette', () => {
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 1)
    expect(contrast('#386641', '#ffffff')).toBeCloseTo(6.67, 1)
    expect(contrast('#064789', '#ffffff')).toBeCloseTo(9.25, 1)
    expect(contrast('oklch(1 0 0)', '#ffffff')).toBeCloseTo(1, 2)
  })
})

describe.each(MOMENT_TYPES.map((type) => [type, `moment-${type.replaceAll('_', '-')}`]))(
  'the %s Momento tint',
  (_type, name) => {
    it('keeps body and secondary text at WCAG AA', () => {
      expect(contrast(token(name), token('foreground'))).toBeGreaterThanOrEqual(4.5)
      expect(contrast(token(name), token('muted-foreground'))).toBeGreaterThanOrEqual(4.5)
    })

    it('keeps field borders and the validation dot at the 3:1 non-text minimum', () => {
      expect(contrast(token(name), token('input'))).toBeGreaterThanOrEqual(3)
      expect(contrast(token(name), token('destructive'))).toBeGreaterThanOrEqual(3)
    })

    it('stays apart from the white surface around it', () => {
      expect(contrast(token(name), '#ffffff')).toBeGreaterThan(1.05)
    })
  }
)

describe('the Ato header in the admin Liturgia form', () => {
  it('keeps its white label at WCAG AA on the strong brand tone', () => {
    expect(contrast(token('brand-deep'), '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })

  it('needs the white ring around the validation dot, which the strong tone alone would swallow', () => {
    expect(contrast(token('brand-deep'), token('destructive'))).toBeLessThan(3)
    expect(contrast('#ffffff', token('destructive'))).toBeGreaterThanOrEqual(3)
  })
})
