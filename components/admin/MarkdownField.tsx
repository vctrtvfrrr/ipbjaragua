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
  defaultValue?: string
  errors?: string[]
}

export function MarkdownField({ defaultValue = '', errors }: Props) {
  const [content, setContent] = useState(defaultValue)

  return (
    <div className="group/field grid gap-2">
      <Label>Conteúdo</Label>
      <MdxEditor markdown={defaultValue} onChange={setContent} />
      <p className="text-muted-foreground text-xs">Para imagens, cole uma URL começando com https://.</p>
      <input type="hidden" name="content" value={content} />
      <FieldError messages={errors} />
    </div>
  )
}
