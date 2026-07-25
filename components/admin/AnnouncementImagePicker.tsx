'use client'

import Image from 'next/image'
import { useState } from 'react'
import { FieldError } from '@/components/admin/FormFeedback'
import { cn } from '@/lib/utils'

export type AnnouncementImageOption = { id: number; url: string }

type Props = {
  images: AnnouncementImageOption[]
  defaultValue?: number | null
  errors?: string[]
}

export function AnnouncementImagePicker({ images, defaultValue, errors }: Props) {
  const [selected, setSelected] = useState<number | null>(defaultValue ?? null)

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <label
          className={cn(
            'flex aspect-video cursor-pointer items-center justify-center rounded-lg border p-2 text-center text-xs',
            selected === null ? 'border-primary bg-primary/10' : 'border-input'
          )}
        >
          <input
            type="radio"
            name="featured_image_id"
            value=""
            checked={selected === null}
            onChange={() => setSelected(null)}
            className="sr-only"
          />
          Sem imagem
        </label>
        {images.map((image) => {
          const isSelected = selected === image.id
          return (
            <label
              key={image.id}
              className={cn(
                'grid cursor-pointer gap-1 rounded-lg border p-1',
                isSelected ? 'border-primary bg-primary/10' : 'border-input'
              )}
            >
              <input
                type="radio"
                name="featured_image_id"
                value={image.id}
                checked={isSelected}
                onChange={() => setSelected(image.id)}
                className="sr-only"
              />
              <Image
                className="aspect-video w-full rounded object-cover"
                src={image.url}
                alt=""
                width={240}
                height={135}
              />
            </label>
          )
        })}
      </div>
      <FieldError messages={errors} />
    </div>
  )
}
