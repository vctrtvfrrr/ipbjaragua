'use client'

import { Popover } from '@base-ui/react/popover'
import { createElement, useRef, useState } from 'react'
import { FieldError } from '@/components/admin/FormFeedback'
import {
  ANNOUNCEMENT_ICON_CATALOG,
  DEFAULT_ANNOUNCEMENT_ICON,
  isCuratedAnnouncementIcon,
  resolveAnnouncementIcon,
  type AnnouncementIconName,
} from '@/lib/announcement-icon'
import { cn } from '@/lib/utils'

type Props = {
  defaultValue?: string
  errors?: string[]
}

export function AnnouncementIconPicker({ defaultValue, errors }: Props) {
  const initial = defaultValue && isCuratedAnnouncementIcon(defaultValue) ? defaultValue : DEFAULT_ANNOUNCEMENT_ICON
  const [selected, setSelected] = useState<AnnouncementIconName>(initial)
  const [open, setOpen] = useState(false)
  const radioRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedEntry = ANNOUNCEMENT_ICON_CATALOG.find(({ name }) => name === selected)!

  function select(name: AnnouncementIconName) {
    setSelected(name)
    setOpen(false)
  }

  function moveSelection(index: number, direction: 1 | -1) {
    const nextIndex = (index + direction + ANNOUNCEMENT_ICON_CATALOG.length) % ANNOUNCEMENT_ICON_CATALOG.length
    radioRefs.current[nextIndex]?.focus()
  }

  return (
    <div className="grid gap-2">
      <input type="hidden" name="icon" value={selected} />
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          className="border-input bg-background hover:bg-accent flex h-9 w-fit items-center justify-center rounded-md border px-3"
          aria-label={`Ícone selecionado: ${selectedEntry.label}`}
        >
          {createElement(resolveAnnouncementIcon(selected), { className: 'size-5', 'aria-hidden': true })}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8} className="z-50">
            <Popover.Popup className="bg-popover text-popover-foreground ring-foreground/10 w-72 rounded-xl p-3 shadow-md ring-1 outline-none">
              <div role="radiogroup" aria-label="Ícone de Aviso" className="grid grid-cols-5 gap-2">
                {ANNOUNCEMENT_ICON_CATALOG.map(({ name, label }, index) => {
                  const Icon = resolveAnnouncementIcon(name)
                  const isSelected = selected === name
                  return (
                    <button
                      key={name}
                      ref={(node) => {
                        radioRefs.current[index] = node
                      }}
                      type="button"
                      role="radio"
                      aria-label={label}
                      aria-checked={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                      className={cn(
                        'flex size-10 items-center justify-center rounded-lg border',
                        isSelected ? 'border-primary bg-primary/10' : 'border-input'
                      )}
                      onClick={() => select(name)}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                          event.preventDefault()
                          moveSelection(index, 1)
                        }
                        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                          event.preventDefault()
                          moveSelection(index, -1)
                        }
                      }}
                    >
                      <Icon className="size-5" aria-hidden />
                    </button>
                  )
                })}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <FieldError messages={errors} />
    </div>
  )
}
