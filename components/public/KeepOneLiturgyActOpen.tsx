'use client'

import { useEffect } from 'react'

/**
 * A controlled accordion could unmount collapsed acts and omit them from print.
 * Named details would close each other during beforeprint and still allow every act to close.
 */
export default function KeepOneLiturgyActOpen({ listId }: { listId: string }) {
  useEffect(() => {
    const list = document.getElementById(listId)
    if (!list) return

    const keepOneActOpen = (event: MouseEvent) => {
      const summary = (event.target as Element).closest('summary')
      const details = summary?.parentElement

      if (!(details instanceof HTMLDetailsElement) || details.parentElement?.parentElement !== list) return

      if (details.open) {
        event.preventDefault()
        return
      }

      list.querySelectorAll<HTMLDetailsElement>(':scope > li > details[open]').forEach((act) => (act.open = false))
    }

    list.addEventListener('click', keepOneActOpen)
    return () => list.removeEventListener('click', keepOneActOpen)
  }, [listId])

  return null
}
