import { z } from 'zod'
import type { LyricsBlock } from './song'

export const lyricsBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('verse'),
    number: z.number().int().positive('Verso deve ser numerado automaticamente'),
    content: z.string().trim().min(1, 'Letra é obrigatória'),
  }),
  z.object({
    type: z.literal('chorus'),
    number: z.null(),
    content: z.string().trim().min(1, 'Letra é obrigatória'),
  }),
])

export const lyricsBlocksSchema = z
  .array(lyricsBlockSchema)
  .min(1, 'Adicione ao menos um bloco')
  .superRefine((blocks, context) => {
    let verseNumber = 1

    blocks.forEach((block, index) => {
      if (block.type === 'chorus') return

      if (block.number !== verseNumber) {
        context.addIssue({
          code: 'custom',
          path: [index, 'number'],
          message: `Verso deve ser o número ${verseNumber}`,
        })
      }

      verseNumber += 1
    })
  })

export const serializedLyricsSchema = z
  .string()
  .transform((value, context) => {
    try {
      return JSON.parse(value) as unknown
    } catch {
      context.addIssue({ code: 'custom', message: 'Letra inválida' })
      return z.NEVER
    }
  })
  .pipe(lyricsBlocksSchema)

export function renumberLyrics(blocks: readonly LyricsBlock[]): LyricsBlock[] {
  let verseNumber = 1

  return blocks.map((block) => {
    if (block.type === 'chorus') return { ...block, number: null }
    return { ...block, number: verseNumber++ }
  })
}

export function moveArrayItem<T>(items: readonly T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= items.length) return [...items]
  if (toIndex < 0 || toIndex >= items.length) return [...items]
  if (fromIndex === toIndex) return [...items]

  const next = [...items]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}
