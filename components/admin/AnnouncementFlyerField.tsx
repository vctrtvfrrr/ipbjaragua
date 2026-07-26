'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  announcementFlyerUrl,
  ANNOUNCEMENT_FLYER_TYPES,
  MAX_ANNOUNCEMENT_FLYER_BYTES,
} from '@/lib/announcement-flyer-config'
import { FieldError } from './FormFeedback'

type Props = {
  flyerPath?: string | null
  errors?: string[]
}

export function AnnouncementFlyerField({ flyerPath, errors }: Props) {
  const [remove, setRemove] = useState(false)
  const [clientError, setClientError] = useState<string>()

  return (
    <div className="grid gap-3">
      {flyerPath && !remove ? (
        <div className="flex items-start gap-3">
          <a href={announcementFlyerUrl(flyerPath)} target="_blank" rel="noreferrer">
            <Image
              src={announcementFlyerUrl(flyerPath)}
              alt=""
              width={160}
              height={200}
              className="max-h-32 w-auto rounded object-contain"
            />
          </a>
          <Button type="button" variant="outline" size="sm" onClick={() => setRemove(true)}>
            Remover Flyer
          </Button>
        </div>
      ) : null}
      {flyerPath && remove ? (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setRemove(false)}>
          Manter Flyer atual
        </Button>
      ) : null}
      <input type="hidden" name="remove_flyer" value={remove ? 'on' : ''} />
      <Input
        id="flyer"
        name="flyer"
        type="file"
        accept={ANNOUNCEMENT_FLYER_TYPES.join(',')}
        aria-describedby={clientError ? 'flyer-client-error' : undefined}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          let message: string | undefined
          if (file && !ANNOUNCEMENT_FLYER_TYPES.includes(file.type as (typeof ANNOUNCEMENT_FLYER_TYPES)[number])) {
            message = 'Envie uma imagem PNG, JPEG ou WEBP.'
          } else if (file && file.size > MAX_ANNOUNCEMENT_FLYER_BYTES) {
            message = 'O Flyer Digital deve ter no máximo 5 MB.'
          }
          event.currentTarget.setCustomValidity(message ?? '')
          setClientError(message)
          if (file && !message) setRemove(false)
        }}
      />
      {clientError ? (
        <p id="flyer-client-error" className="text-destructive text-sm">
          {clientError}
        </p>
      ) : null}
      <FieldError messages={errors} />
    </div>
  )
}
