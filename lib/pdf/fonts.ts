import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const FONTS_DIR = join(process.cwd(), 'assets', 'fonts')

const FACES = [
  { file: 'PT_Sans-Web-Regular.ttf', family: 'PT Sans', weight: 400 },
  { file: 'PT_Sans-Web-Bold.ttf', family: 'PT Sans', weight: 700 },
  { file: 'PT_Serif-Web-Bold.ttf', family: 'PT Serif', weight: 700 },
] as const

let faceCssPromise: Promise<string> | null = null

// Chromium renders the document with no network at all, so the typefaces have to travel
// inside the HTML; the slim runtime image ships no fonts of its own.
export function loadPdfFontFaceCss(): Promise<string> {
  faceCssPromise ??= Promise.all(
    FACES.map(async ({ file, family, weight }) => {
      const data = await readFile(join(FONTS_DIR, file))
      return `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;src:url(data:font/ttf;base64,${data.toString('base64')}) format('truetype')}`
    })
  ).then((faces) => faces.join(''))

  return faceCssPromise
}
