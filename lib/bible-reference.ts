export type BibleCitation = {
  book: string
  ranges: Array<{ chapter: number; verses: number[] | null }>
}

export type BibleVerse = { number: number; text: string }

export type BibleBook = {
  chapters: Array<{ number: number; verses: BibleVerse[] }>
}

export type ParsedBibleReference = { reference: string; citation: BibleCitation }

export type BibleReferenceError = { error: string }

// `name` is the spelling the system writes back; `aliases` are the spellings it also reads.
// Accent, case, inner spaces and dots are normalized away, so only genuinely different words
// belong here. PSA is written "Salmo" because that is how the church cites it, even though
// the source names the book "Salmos".
const BIBLE_BOOKS = [
  { code: 'GEN', name: 'Gênesis', aliases: ['Gn'] },
  { code: 'EXO', name: 'Êxodo', aliases: ['Êx'] },
  { code: 'LEV', name: 'Levítico', aliases: ['Lv'] },
  { code: 'NUM', name: 'Números', aliases: ['Nm'] },
  { code: 'DEU', name: 'Deuteronômio', aliases: ['Dt'] },
  { code: 'JOS', name: 'Josué', aliases: ['Js'] },
  { code: 'JDG', name: 'Juízes', aliases: ['Jz'] },
  { code: 'RUT', name: 'Rute', aliases: ['Rt'] },
  { code: '1SA', name: '1 Samuel', aliases: ['1Sm'] },
  { code: '2SA', name: '2 Samuel', aliases: ['2Sm'] },
  { code: '1KI', name: '1 Reis', aliases: ['1Rs'] },
  { code: '2KI', name: '2 Reis', aliases: ['2Rs'] },
  { code: '1CH', name: '1 Crônicas', aliases: ['1Cr'] },
  { code: '2CH', name: '2 Crônicas', aliases: ['2Cr'] },
  { code: 'EZR', name: 'Esdras', aliases: ['Ed'] },
  { code: 'NEH', name: 'Neemias', aliases: ['Ne'] },
  { code: 'EST', name: 'Ester', aliases: ['Et'] },
  { code: 'JOB', name: 'Jó', aliases: ['Job'] },
  { code: 'PSA', name: 'Salmo', aliases: ['Salmos', 'Sl'] },
  { code: 'PRO', name: 'Provérbios', aliases: ['Provérbio', 'Pv'] },
  { code: 'ECC', name: 'Eclesiastes', aliases: ['Ec'] },
  { code: 'SNG', name: 'Cânticos', aliases: ['Cântico dos Cânticos', 'Cantares', 'Ct'] },
  { code: 'ISA', name: 'Isaías', aliases: ['Is'] },
  { code: 'JER', name: 'Jeremias', aliases: ['Jr'] },
  { code: 'LAM', name: 'Lamentações de Jeremias', aliases: ['Lamentações', 'Lm'] },
  { code: 'EZK', name: 'Ezequiel', aliases: ['Ez'] },
  { code: 'DAN', name: 'Daniel', aliases: ['Dn'] },
  { code: 'HOS', name: 'Oséias', aliases: ['Os'] },
  { code: 'JOL', name: 'Joel', aliases: ['Jl'] },
  { code: 'AMO', name: 'Amós', aliases: ['Am'] },
  { code: 'OBA', name: 'Obadias', aliases: ['Ob'] },
  { code: 'JON', name: 'Jonas', aliases: ['Jn'] },
  { code: 'MIC', name: 'Miquéias', aliases: ['Mq'] },
  { code: 'NAM', name: 'Naum', aliases: ['Na'] },
  { code: 'HAB', name: 'Habacuque', aliases: ['Hc'] },
  { code: 'ZEP', name: 'Sofonias', aliases: ['Sf'] },
  { code: 'HAG', name: 'Ageu', aliases: ['Ag'] },
  { code: 'ZEC', name: 'Zacarias', aliases: ['Zc'] },
  { code: 'MAL', name: 'Malaquias', aliases: ['Ml'] },
  { code: 'MAT', name: 'Mateus', aliases: ['Mt'] },
  { code: 'MRK', name: 'Marcos', aliases: ['Mc'] },
  { code: 'LUK', name: 'Lucas', aliases: ['Lc'] },
  { code: 'JHN', name: 'João', aliases: ['Jo'] },
  { code: 'ACT', name: 'Atos', aliases: ['Atos dos Apóstolos', 'At'] },
  { code: 'ROM', name: 'Romanos', aliases: ['Rm'] },
  { code: '1CO', name: '1 Coríntios', aliases: ['1Co'] },
  { code: '2CO', name: '2 Coríntios', aliases: ['2Co'] },
  { code: 'GAL', name: 'Gálatas', aliases: ['Gl'] },
  { code: 'EPH', name: 'Efésios', aliases: ['Ef'] },
  { code: 'PHP', name: 'Filipenses', aliases: ['Fp'] },
  { code: 'COL', name: 'Colossenses', aliases: ['Cl'] },
  { code: '1TH', name: '1 Tessalonicenses', aliases: ['1Ts'] },
  { code: '2TH', name: '2 Tessalonicenses', aliases: ['2Ts'] },
  { code: '1TI', name: '1 Timóteo', aliases: ['1Tm'] },
  { code: '2TI', name: '2 Timóteo', aliases: ['2Tm'] },
  { code: 'TIT', name: 'Tito', aliases: ['Tt'] },
  { code: 'PHM', name: 'Filemom', aliases: ['Filemon', 'Fm'] },
  { code: 'HEB', name: 'Hebreus', aliases: ['Hb'] },
  { code: 'JAS', name: 'Tiago', aliases: ['Tg'] },
  { code: '1PE', name: '1 Pedro', aliases: ['1Pe'] },
  { code: '2PE', name: '2 Pedro', aliases: ['2Pe'] },
  { code: '1JN', name: '1 João', aliases: ['1Jo'] },
  { code: '2JN', name: '2 João', aliases: ['2Jo'] },
  { code: '3JN', name: '3 João', aliases: ['3Jo'] },
  { code: 'JUD', name: 'Judas', aliases: ['Jd'] },
  { code: 'REV', name: 'Apocalipse', aliases: ['Ap'] },
] as const

const MISSING_BOOK = 'Informe o livro da referência bíblica.'
const MISSING_CHAPTER = 'Informe o capítulo da referência bíblica.'
const CROSS_CHAPTER = 'Intervalo entre capítulos não é aceito: registre uma Passagem por capítulo.'

// No book has more than 150 chapters and no chapter more than 176 verses, so a number past
// this ceiling is a typo, not a reference — and expanding it would be an unbounded loop.
const HIGHEST_NUMBER = 999

const REFERENCE = /^\s*([1-3])?\s*(\p{L}[\p{L}\s.]*?)\s*(\d.*?)\s*$/u
const CHAPTER = /^(\d+)(?:\s*[.:]\s*(.+))?$/
const VERSES = /^(\d+)([ab])?(?:\s*-\s*(\d+)([ab])?)?$/

export function parseBibleReference(input: string): ParsedBibleReference | BibleReferenceError {
  const match = REFERENCE.exec(input)
  if (!match) return { error: /\p{L}/u.test(input) ? MISSING_CHAPTER : MISSING_BOOK }

  const [, numeral = '', name, rest] = match
  const book = findBook(numeral + name)
  if (!book) return { error: `Livro não reconhecido: "${[numeral, name].filter(Boolean).join(' ')}".` }

  const chapterMatch = CHAPTER.exec(rest)
  if (!chapterMatch) return { error: `Trecho inválido: "${rest}".` }

  const chapter = Number(chapterMatch[1])
  if (!numbered(chapter)) return { error: `Trecho inválido: "${rest}".` }
  if (!chapterMatch[2]) {
    return { reference: `${book.name} ${chapter}`, citation: { book: book.code, ranges: [{ chapter, verses: null }] } }
  }

  const verses: number[] = []
  const written: string[] = []

  for (const piece of chapterMatch[2].split(',')) {
    const match = VERSES.exec(piece.trim())
    if (!match) {
      return { error: /\d\s*[.:]\s*\d/.test(piece) ? CROSS_CHAPTER : `Trecho inválido: "${piece.trim()}".` }
    }

    const [, from, fromHalf = '', to, toHalf = ''] = match
    const last = Number(to ?? from)
    if (!numbered(Number(from)) || !numbered(last) || last < Number(from)) {
      return { error: `Trecho inválido: "${piece.trim()}".` }
    }

    for (let verse = Number(from); verse <= last; verse += 1) verses.push(verse)
    written.push(to ? `${Number(from)}${fromHalf}-${Number(to)}${toHalf}` : `${Number(from)}${fromHalf}`)
  }

  return {
    reference: `${book.name} ${chapter}:${written.join(',')}`,
    citation: { book: book.code, ranges: [{ chapter, verses: [...new Set(verses)].sort((a, b) => a - b) }] },
  }
}

const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const VERSE_NUMBER = new RegExp(`^([${SUPERSCRIPT}]+)\\s*`)

// The verse number rides inside the text because the text is a snapshot: once the operator has
// edited it, nothing downstream still knows where one verse ended and the next began.
export function numberBibleVerses(verses: BibleVerse[]): string {
  return verses
    .map((verse) => `${String(verse.number).replace(/\d/g, (digit) => SUPERSCRIPT[Number(digit)])} ${verse.text}`)
    .join('\n')
}

// The inverse, for whoever renders the snapshot: PT Serif draws ¹²³ heavier than the fallback
// face that has to serve ⁴ through ⁹, so a reader shown the raw characters sees two sizes in
// the same number. Handing the digits back lets the page mark them up instead.
export function readNumberedVerses(text: string): Array<{ number: string | null; text: string }> {
  return text.split('\n').map((line) => {
    const match = VERSE_NUMBER.exec(line)
    if (!match) return { number: null, text: line }
    return {
      number: match[1].replace(/./gu, (character) => String(SUPERSCRIPT.indexOf(character))),
      text: line.slice(match[0].length),
    }
  })
}

export function sliceBibleVerses(citation: BibleCitation, book: BibleBook): BibleVerse[] {
  return citation.ranges.flatMap((range) => {
    const chapter = book.chapters.find((candidate) => candidate.number === range.chapter)
    if (!chapter) return []
    if (range.verses === null) return chapter.verses
    return range.verses.flatMap((number) => chapter.verses.find((verse) => verse.number === number) ?? [])
  })
}

type BibleBookEntry = (typeof BIBLE_BOOKS)[number]

const spelled = new Map<string, BibleBookEntry>()
const unaccented = new Map<string, BibleBookEntry>()

for (const book of BIBLE_BOOKS) {
  for (const alias of [book.name, ...book.aliases]) {
    const key = normalize(alias)
    if (!spelled.has(key)) spelled.set(key, book)
    if (!unaccented.has(unaccent(key))) unaccented.set(unaccent(key), book)
  }
}

// The accented spelling wins before accents are folded away, because folding collides "Jó"
// with "Jo" — and "Jo" is João everywhere in this church's bulletins.
function findBook(raw: string): BibleBookEntry | undefined {
  const key = normalize(raw)
  return spelled.get(key) ?? unaccented.get(unaccent(key))
}

function numbered(value: number): boolean {
  return value >= 1 && value <= HIGHEST_NUMBER
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[\s.]/g, '')
}

function unaccent(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '')
}
