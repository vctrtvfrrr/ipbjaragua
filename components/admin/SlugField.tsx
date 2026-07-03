'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { slugify } from '@/lib/slug'
import { FieldError } from './FormFeedback'

type Props = {
  mode: 'create' | 'edit'
  title: string
  defaultValue?: string
  errors?: string[]
}

export function SlugField({ mode, title, defaultValue = '', errors }: Props) {
  const [slug, setSlug] = useState(defaultValue)
  const [dirty, setDirty] = useState(defaultValue !== '')

  const autoFill = mode === 'create' && !dirty
  const value = autoFill ? slugify(title) : slug

  function handleChange(next: string) {
    setSlug(next)
    setDirty(next !== '')
  }

  return (
    <div className="group/field grid gap-2">
      <Label htmlFor="slug">Slug</Label>
      <Input id="slug" name="slug" value={value} onChange={(event) => handleChange(event.target.value)} />
      <FieldError messages={errors} />
    </div>
  )
}
