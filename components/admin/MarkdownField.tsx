'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { FieldError } from './FormFeedback'

const MdxEditor = dynamic(() => import('./MdxEditor'), {
  ssr: false,
  loading: () => (
    <div className="text-muted-foreground flex min-h-64 items-center rounded-lg border px-3 py-2 text-sm">
      Carregando editor…
    </div>
  ),
})

type Props = {
  label?: string
  name?: string
  defaultValue?: string
  errors?: string[]
  onChange?: (value: string) => void
}

export function MarkdownField({ label = 'Conteúdo', name = 'content', defaultValue = '', errors, onChange }: Props) {
  const [content, setContent] = useState(defaultValue)

  return (
    <div className="group/field grid min-w-0 gap-2">
      <Label>{label}</Label>
      <MdxEditor
        markdown={defaultValue}
        onChange={(value) => {
          setContent(value)
          onChange?.(value)
        }}
      />
      <input type="hidden" name={name} value={content} />
      <FieldError messages={errors} />
    </div>
  )
}
