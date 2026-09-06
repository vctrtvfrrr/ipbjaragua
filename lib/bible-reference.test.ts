import { describe, expect, it } from 'vitest'
import { acervoReferences } from '@/tests/acervo'
import { parseBibleReference, sliceBibleText, type BibleCitation } from './bible-reference'

function parse(input: string) {
  const result = parseBibleReference(input)
  if ('error' in result) throw new Error(`Expected "${input}" to parse, got: ${result.error}`)
  return result
}

function errorFor(input: string): string {
  const result = parseBibleReference(input)
  if (!('error' in result)) throw new Error(`Expected "${input}" to be rejected`)
  return result.error
}

describe('parseBibleReference', () => {
  it('reads a whole chapter without enumerating its verses', () => {
    expect(parse('Marcos 8')).toEqual({
      reference: 'Marcos 8',
      citation: { book: 'MRK', ranges: [{ chapter: 8, verses: null }] },
    })
  })

  it('reads a single verse', () => {
    expect(parse('Mateus 6:13')).toEqual({
      reference: 'Mateus 6:13',
      citation: { book: 'MAT', ranges: [{ chapter: 6, verses: [13] }] },
    })
  })

  it('reads a range as the verses it covers', () => {
    expect(parse('João 4:1-18')).toEqual({
      reference: 'João 4:1-18',
      citation: {
        book: 'JHN',
        ranges: [{ chapter: 4, verses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] }],
      },
    })
  })

  it('reads a list of verses and ranges', () => {
    expect(parse('Salmo 32:7,10-11')).toEqual({
      reference: 'Salmo 32:7,10-11',
      citation: { book: 'PSA', ranges: [{ chapter: 32, verses: [7, 10, 11] }] },
    })
  })

  it('treats a dot and a colon as the same separator', () => {
    expect(parse('Marcos 14.22-26')).toEqual(parse('Marcos 14:22-26'))
  })

  it('accepts the spellings the church already writes', () => {
    const psalm = { book: 'PSA', ranges: [{ chapter: 32, verses: [7] }] }
    for (const input of ['Sl 32.7', 'Salmo 32:7', 'Salmos 32:7', 'SALMOS 32:7']) {
      expect(parse(input)).toEqual({ reference: 'Salmo 32:7', citation: psalm })
    }
  })

  it('accepts an optional accent and an optional space after the numeral', () => {
    expect(parse('Genesis 1:1').citation.book).toBe('GEN')
    expect(parse('Gênesis 1:1').citation.book).toBe('GEN')
    expect(parse('1João 4:8').reference).toBe('1 João 4:8')
    expect(parse('1 João 4:8').reference).toBe('1 João 4:8')
    expect(parse('1Coríntios 13:1').citation.book).toBe('1CO')
  })

  it('reads "Jo" as João and "Jó" as Jó', () => {
    expect(parse('Jo 3:16').citation.book).toBe('JHN')
    expect(parse('Jó 3:16').citation.book).toBe('JOB')
  })

  it('keeps a half-verse suffix in the reference and drops it from the citation', () => {
    expect(parse('Salmo 95:7a')).toEqual({
      reference: 'Salmo 95:7a',
      citation: { book: 'PSA', ranges: [{ chapter: 95, verses: [7] }] },
    })
    expect(parse('Salmo 95:7b-9')).toEqual({
      reference: 'Salmo 95:7b-9',
      citation: { book: 'PSA', ranges: [{ chapter: 95, verses: [7, 8, 9] }] },
    })
  })

  it('rewrites the reference in the canonical spelling', () => {
    expect(parse('sl 32.07, 10 - 11').reference).toBe('Salmo 32:7,10-11')
  })

  it('rejects a reference without a book', () => {
    expect(errorFor('2:1-5')).toBe('Informe o livro da referência bíblica.')
  })

  it('rejects a range across chapters', () => {
    expect(errorFor('Mateus 5:1-7:29')).toContain('Intervalo entre capítulos')
  })

  it('rejects a book it does not know', () => {
    expect(errorFor('Enoque 1:1')).toBe('Livro não reconhecido: "Enoque".')
  })

  it('says what is missing when only the book was written', () => {
    expect(errorFor('Marcos')).toBe('Informe o capítulo da referência bíblica.')
  })

  it('rejects an unreadable verse list', () => {
    expect(errorFor('Marcos 8:1--3')).toBe('Trecho inválido: "1--3".')
    expect(errorFor('Marcos 8:18-1')).toBe('Trecho inválido: "18-1".')
  })

  it('rejects a number no chapter or verse could have, instead of expanding it', () => {
    expect(errorFor('João 3:9007199254740992')).toBe('Trecho inválido: "9007199254740992".')
    expect(errorFor('João 3:1-100000')).toBe('Trecho inválido: "1-100000".')
    expect(errorFor('João 100000:1')).toBe('Trecho inválido: "100000:1".')
    expect(errorFor('João 0:1')).toBe('Trecho inválido: "0:1".')
    expect(errorFor('João 3:0')).toBe('Trecho inválido: "0".')
  })
})

describe('the Acervo Histórico corpus', () => {
  it('parses every reference except the three written without a book', async () => {
    const references = await acervoReferences()
    const rejected = references.filter((reference) => 'error' in parseBibleReference(reference))

    expect(references).toHaveLength(340)
    expect(rejected).toEqual(['2:1-5', '2:20-23', '3:1-6'])
  })
})

describe('sliceBibleText', () => {
  const book = {
    chapters: [
      {
        number: 32,
        verses: [
          { number: 7, text: 'Tu és o meu esconderijo' },
          { number: 8, text: 'Instruir-te-ei' },
          { number: 10, text: 'Muitas são as dores' },
          { number: 11, text: 'Alegrai-vos no SENHOR' },
        ],
      },
    ],
  }

  it('cuts the listed verses, in order', () => {
    const citation: BibleCitation = { book: 'PSA', ranges: [{ chapter: 32, verses: [7, 10, 11] }] }
    expect(sliceBibleText(citation, book)).toEqual([
      'Tu és o meu esconderijo',
      'Muitas são as dores',
      'Alegrai-vos no SENHOR',
    ])
  })

  it('cuts a whole chapter without being told how long it is', () => {
    const citation: BibleCitation = { book: 'PSA', ranges: [{ chapter: 32, verses: null }] }
    expect(sliceBibleText(citation, book)).toHaveLength(4)
  })

  it('cuts nothing when the chapter is not in the book', () => {
    expect(sliceBibleText({ book: 'PSA', ranges: [{ chapter: 99, verses: null }] }, book)).toEqual([])
  })
})
