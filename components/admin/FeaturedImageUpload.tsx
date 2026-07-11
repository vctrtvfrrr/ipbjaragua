'use client'

import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { uploadFeaturedImageAction } from '@/app/(admin)/admin/featured-images/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ActionState } from '@/lib/entity-action'
import { FormError } from './FormFeedback'

const INITIAL: ActionState = { status: 'idle' }

export function FeaturedImageUpload() {
  const [state, action, pending] = useActionState(uploadFeaturedImageAction, INITIAL)
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.status === 'success') {
      toast.success('Imagem enviada')
      form.current?.reset()
    }
  }, [state.status])
  return (
    <form ref={form} action={action} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_auto]">
      <Input name="image" type="file" accept="image/png,image/jpeg,image/webp" required />
      <Button type="submit" disabled={pending}>
        {pending ? 'Enviando…' : 'Enviar imagem'}
      </Button>
      <div className="sm:col-span-2">
        <FormError message={state.status === 'error' ? state.formError : undefined} />
      </div>
    </form>
  )
}
