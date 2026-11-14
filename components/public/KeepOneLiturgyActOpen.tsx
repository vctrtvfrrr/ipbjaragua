'use client'

import { useEffect } from 'react'
import { scrollToHeader } from '@/lib/scroll-to-header'

export default function KeepOneLiturgyActOpen({ listId }: { listId: string }) {
  useEffect(() => {
    const list = document.getElementById(listId)
    if (!list) return

    const acts = () => [...list.querySelectorAll<HTMLDetailsElement>(':scope > li > details')]

    const openOnly = (target: HTMLDetailsElement) =>
      acts().forEach((act) => {
        if (act !== target) act.open = false
      })

    const openActFromHash = () => {
      const act = acts()[actIndexFromHash(window.location.hash)]
      if (!act) return
      openOnly(act)
      act.open = true
      scrollToHeader(act.querySelector('summary'))
    }
    openActFromHash()

    const keepOneActOpen = (event: MouseEvent) => {
      const summary = (event.target as Element).closest('summary')
      const details = summary?.parentElement

      if (!(details instanceof HTMLDetailsElement) || details.parentElement?.parentElement !== list) return

      if (details.open) {
        event.preventDefault()
        return
      }

      openOnly(details)
      history.replaceState(history.state, '', `#ato-${acts().indexOf(details) + 1}`)
      scrollToHeader(summary)
    }

    list.addEventListener('click', keepOneActOpen)
    window.addEventListener('hashchange', openActFromHash)
    // Until this listener is live, clicking an open Ato closes it natively and nothing
    // reopens it, so a reader — or a test — can tell the enhancement apart from the
    // plain markup instead of guessing that hydration already happened.
    list.dataset.keepOneActOpen = 'on'

    return () => {
      delete list.dataset.keepOneActOpen
      list.removeEventListener('click', keepOneActOpen)
      window.removeEventListener('hashchange', openActFromHash)
    }
  }, [listId])

  return null
}

function actIndexFromHash(hash: string) {
  const match = /^#ato-(\d+)$/.exec(hash)
  return match ? Number(match[1]) - 1 : -1
}
