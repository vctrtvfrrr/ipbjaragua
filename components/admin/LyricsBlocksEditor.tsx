'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { lyricsBlocksSchema, moveArrayItem, renumberLyrics } from '@/lib/lyrics'
import type { LyricsBlock } from '@/lib/song'
import { FieldError } from './FormFeedback'

type BlockError = { content?: string[] }

type Props = {
  blocks: LyricsBlock[]
  onChange: (blocks: LyricsBlock[]) => void
  errors: { form?: string[]; blocks?: Record<number, BlockError> }
  onErrorsChange: (errors: { form?: string[]; blocks?: Record<number, BlockError> }) => void
}

export function LyricsBlocksEditor({ blocks, onChange, errors, onErrorsChange }: Props) {
  function update(next: LyricsBlock[]) {
    onErrorsChange({})
    onChange(renumberLyrics(next))
  }

  function addBlock(type: LyricsBlock['type']) {
    update([...blocks, { type, number: type === 'verse' ? 1 : null, content: '' }])
  }

  function removeBlock(index: number) {
    update(blocks.filter((_, currentIndex) => currentIndex !== index))
  }

  function moveBlock(index: number, direction: -1 | 1) {
    update(moveArrayItem(blocks, index, index + direction))
  }

  function updateContent(index: number, content: string) {
    update(blocks.map((block, currentIndex) => (currentIndex === index ? { ...block, content } : block)))
  }

  function updateType(index: number, type: LyricsBlock['type']) {
    update(blocks.map((block, currentIndex) => (currentIndex === index ? { ...block, type } : block)))
  }

  return (
    <FormField>
      <div className="flex items-center justify-between gap-3">
        <Label>Blocos de letra</Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => addBlock('verse')}>
            <Plus data-icon="inline-start" />
            Verso
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => addBlock('chorus')}>
            <Plus data-icon="inline-start" />
            Coro
          </Button>
        </div>
      </div>

      <FieldError messages={errors.form} />

      <div className="grid gap-3">
        {blocks.map((block, index) => (
          <div key={index} className="grid gap-3 rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={block.type === 'verse' ? 'default' : 'outline'}
                  onClick={() => updateType(index, 'verse')}
                >
                  Verso{block.type === 'verse' && block.number ? ` ${block.number}` : ''}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={block.type === 'chorus' ? 'default' : 'outline'}
                  onClick={() => updateType(index, 'chorus')}
                >
                  Coro
                </Button>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Mover para cima"
                  disabled={index === 0}
                  onClick={() => moveBlock(index, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Mover para baixo"
                  disabled={index === blocks.length - 1}
                  onClick={() => moveBlock(index, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  aria-label="Remover bloco"
                  onClick={() => removeBlock(index)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            <Textarea
              value={block.content}
              onChange={(event) => updateContent(index, event.target.value)}
              aria-invalid={Boolean(errors.blocks?.[index]?.content)}
            />
            <FieldError messages={errors.blocks?.[index]?.content} />
          </div>
        ))}
      </div>
    </FormField>
  )
}

export function validateLyricsBlocks(blocks: LyricsBlock[]): Props['errors'] {
  const result = lyricsBlocksSchema.safeParse(blocks)
  if (result.success) return {}

  const errors: Props['errors'] = { blocks: {} }

  for (const issue of result.error.issues) {
    if (issue.path.length === 0) {
      errors.form = [...(errors.form ?? []), issue.message]
      continue
    }

    const [index, field] = issue.path
    if (typeof index !== 'number' || field !== 'content') continue
    errors.blocks ??= {}
    errors.blocks[index] ??= {}
    errors.blocks[index].content = [...(errors.blocks[index].content ?? []), issue.message]
  }

  return errors
}
