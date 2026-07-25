'use client'

import { useState } from 'react'
import { FieldError } from '@/components/admin/FormFeedback'
import {
  ANNOUNCEMENT_ICON_CATALOG,
  DEFAULT_ANNOUNCEMENT_ICON,
  isCuratedAnnouncementIcon,
  resolveAnnouncementIcon,
} from '@/lib/announcement-icon'
import { cn } from '@/lib/utils'

type Props = {
  defaultValue?: string
  errors?: string[]
}

export function AnnouncementIconPicker({ defaultValue, errors }: Props) {
  const initial = defaultValue && isCuratedAnnouncementIcon(defaultValue) ? defaultValue : DEFAULT_ANNOUNCEMENT_ICON
  const [selected, setSelected] = useState(initial)

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
        {ANNOUNCEMENT_ICON_CATALOG.map(({ name, label }) => {
          const Icon = resolveAnnouncementIcon(name)
          const isSelected = selected === name
          return (
            <label
              key={name}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-2 text-center text-xs',
                isSelected ? 'border-primary bg-primary/10' : 'border-input'
              )}
            >
              <input
                type="radio"
                name="icon"
                value={name}
                checked={isSelected}
                onChange={() => setSelected(name)}
                className="sr-only"
              />
              <Icon className="size-5" />
              <span>{label}</span>
            </label>
          )
        })}
      </div>
      <FieldError messages={errors} />
    </div>
  )
}
