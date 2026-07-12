import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { OG_COLORS } from './config'

const FONTS_DIR = join(process.cwd(), 'assets', 'fonts')
const LOGO_PATH = join(process.cwd(), 'public', 'images', 'logo.svg')

export type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }

async function loadFont(file: string): Promise<ArrayBuffer> {
  const buffer = await readFile(join(FONTS_DIR, file))
  return Uint8Array.from(buffer).buffer
}

let fontsPromise: Promise<OgFont[]> | null = null

export function loadOgFonts(): Promise<OgFont[]> {
  fontsPromise ??= (async () => {
    const [sans, sansBold, narrowBold, serifBold] = await Promise.all([
      loadFont('PT_Sans-Web-Regular.ttf'),
      loadFont('PT_Sans-Web-Bold.ttf'),
      loadFont('PT_Sans-Narrow-Web-Bold.ttf'),
      loadFont('PT_Serif-Web-Bold.ttf'),
    ])
    return [
      { name: 'PT Sans', data: sans, weight: 400, style: 'normal' },
      { name: 'PT Sans', data: sansBold, weight: 700, style: 'normal' },
      { name: 'PT Sans Narrow', data: narrowBold, weight: 700, style: 'normal' },
      { name: 'PT Serif', data: serifBold, weight: 700, style: 'normal' },
    ]
  })()
  return fontsPromise
}

let logoPromise: Promise<string> | null = null

export function loadLogoDataUri(): Promise<string> {
  logoPromise ??= (async () => {
    const svg = await readFile(LOGO_PATH, 'utf8')
    const recolored = svg.replace(/#041\b/gi, OG_COLORS.green)
    return `data:image/svg+xml;base64,${Buffer.from(recolored).toString('base64')}`
  })()
  return logoPromise
}
