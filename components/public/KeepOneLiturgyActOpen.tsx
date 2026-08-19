'use client'

import { useEffect } from 'react'

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
    // Until this listener is live, clicking an open Ato closes it natively and nothing
    // reopens it, so a reader — or a test — can tell the enhancement apart from the
    // plain markup instead of guessing that hydration already happened.
    list.dataset.keepOneActOpen = 'on'

    return () => {
      delete list.dataset.keepOneActOpen
      list.removeEventListener('click', keepOneActOpen)
    }
  }, [listId])

  return null
}
