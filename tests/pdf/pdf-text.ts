import { inflateSync } from 'node:zlib'

type PdfObject = { dict: string; stream: Buffer | null }

// Chromium subsets its fonts and writes glyph ids, so the only way to read a generated PDF
// back is to walk the objects and decode each font's ToUnicode map. It is the smallest
// parser that makes "what does this page actually say" an assertable question.
export function pdfPageTexts(pdf: Buffer): string[] {
  const objects = parseObjects(pdf)

  return pageNumbers(objects).map((number) => pageText(objects, objects.get(number)!))
}

export function pdfPageSizes(pdf: Buffer): { width: number; height: number }[] {
  const objects = parseObjects(pdf)
  const inherited = [...objects.values()].find((object) => object.dict.includes('/Type /Pages'))

  return pageNumbers(objects).map((number) => mediaBox(objects.get(number)!) ?? mediaBox(inherited!) ?? NO_BOX)
}

const NO_BOX = { width: 0, height: 0 }

function mediaBox(object: PdfObject | undefined): { width: number; height: number } | null {
  const match = object && /MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(object.dict)

  return match ? { width: Number(match[1]), height: Number(match[2]) } : null
}

function parseObjects(pdf: Buffer): Map<number, PdfObject> {
  const objects = parseTopLevelObjects(pdf)
  expandObjectStreams(objects)

  return objects
}

// pdf-lib packs the small objects of a merged document into object streams, so the page and
// font dictionaries of a Livro are not in the file as plain text the way Chromium wrote them.
function expandObjectStreams(objects: Map<number, PdfObject>): void {
  for (const object of [...objects.values()]) {
    if (!object.dict.includes('/ObjStm') || !object.stream) continue

    const total = Number(/\/N\s+(\d+)/.exec(object.dict)?.[1] ?? 0)
    const first = Number(/\/First\s+(\d+)/.exec(object.dict)?.[1] ?? 0)
    const body = object.stream.toString('latin1')
    const header = body.slice(0, first).trim().split(/\s+/).map(Number)

    for (let index = 0; index < total; index++) {
      const start = first + header[index * 2 + 1]
      const end = index + 1 < total ? first + header[index * 2 + 3] : body.length
      objects.set(header[index * 2], { dict: body.slice(start, end), stream: null })
    }
  }
}

function parseTopLevelObjects(pdf: Buffer): Map<number, PdfObject> {
  const latin = pdf.toString('latin1')
  const objects = new Map<number, PdfObject>()

  for (const match of latin.matchAll(/(\d+) 0 obj\b/g)) {
    const start = match.index + match[0].length
    const end = latin.indexOf('endobj', start)
    const body = latin.slice(start, end)
    const marker = /stream\r?\n/.exec(body)

    if (!marker) {
      objects.set(Number(match[1]), { dict: body, stream: null })
      continue
    }

    const dict = body.slice(0, marker.index)
    const raw = Buffer.from(body.slice(marker.index + marker[0].length, body.lastIndexOf('endstream')), 'latin1')
    objects.set(Number(match[1]), { dict, stream: dict.includes('/FlateDecode') ? inflateSync(raw) : raw })
  }

  return objects
}

function pageNumbers(objects: Map<number, PdfObject>): number[] {
  for (const object of objects.values()) {
    if (!object.dict.includes('/Type /Pages')) continue

    const kids = /\/Kids\s*\[([^\]]*)\]/.exec(object.dict)
    if (kids) return [...kids[1].matchAll(/(\d+) 0 R/g)].map((match) => Number(match[1]))
  }

  return []
}

function pageText(objects: Map<number, PdfObject>, page: PdfObject): string {
  const fonts = new Map<string, Map<number, string>>()
  const fontDict = /\/Font\s*<<([\s\S]*?)>>/.exec(page.dict)

  for (const match of fontDict?.[1].matchAll(/(\/F\d+)\s+(\d+) 0 R/g) ?? []) {
    fonts.set(match[1], toUnicodeMap(objects, objects.get(Number(match[2]))!))
  }

  const contents = /\/Contents\s+(\d+) 0 R/.exec(page.dict)
  const stream = contents ? (objects.get(Number(contents[1]))?.stream ?? null) : null

  return stream ? decodeContent(stream.toString('latin1'), fonts) : ''
}

function toUnicodeMap(objects: Map<number, PdfObject>, font: PdfObject): Map<number, string> {
  const map = new Map<number, string>()
  const reference = /\/ToUnicode\s+(\d+) 0 R/.exec(font.dict)
  const cmap = reference ? objects.get(Number(reference[1]))?.stream?.toString('latin1') : null
  if (!cmap) return map

  for (const block of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const pair of block[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) {
      map.set(parseInt(pair[1], 16), fromUtf16(pair[2]))
    }
  }

  for (const block of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const range of block[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) {
      const [low, high, destination] = [parseInt(range[1], 16), parseInt(range[2], 16), parseInt(range[3], 16)]
      for (let code = low; code <= high; code++) map.set(code, String.fromCodePoint(destination + code - low))
    }
  }

  return map
}

function fromUtf16(hex: string): string {
  const units = hex.match(/.{4}/g) ?? []
  return String.fromCharCode(...units.map((unit) => parseInt(unit, 16)))
}

function decodeContent(content: string, fonts: Map<string, Map<number, string>>): string {
  const tokens = content.matchAll(
    /(\/F\d+)\s+[\d.]+\s+Tf|([-\d.]+)\s+([-\d.]+)\s+Tm|<([0-9a-fA-F]+)>\s*Tj|\[([^\]]*)\]\s*TJ/g
  )
  let current = new Map<number, string>()
  let baseline: string | null = null
  let text = ''

  for (const token of tokens) {
    if (token[1]) current = fonts.get(token[1]) ?? new Map()
    // A wrap emits no space glyph, so without the baseline the last word of a line and the
    // first of the next would read as one.
    else if (token[3]) {
      if (baseline !== null && baseline !== token[3]) text += '\n'
      baseline = token[3]
    } else if (token[4]) text += decodeHex(token[4], current)
    else if (token[5]) for (const part of token[5].matchAll(/<([0-9a-fA-F]+)>/g)) text += decodeHex(part[1], current)
  }

  return text
}

function decodeHex(hex: string, font: Map<number, string>): string {
  return (hex.match(/.{4}/g) ?? []).map((unit) => font.get(parseInt(unit, 16)) ?? '').join('')
}
