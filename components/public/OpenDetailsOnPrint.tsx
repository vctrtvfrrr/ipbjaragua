'use client'

import { useEffect } from 'react'

export default function OpenDetailsOnPrint() {
  useEffect(() => {
    let opened: HTMLDetailsElement[] = []

    const openAll = () => {
      opened = [...document.querySelectorAll<HTMLDetailsElement>('details:not([open])')]
      opened.forEach((element) => (element.open = true))
    }
    const restore = () => {
      opened.forEach((element) => (element.open = false))
      opened = []
    }

    window.addEventListener('beforeprint', openAll)
    window.addEventListener('afterprint', restore)
    return () => {
      window.removeEventListener('beforeprint', openAll)
      window.removeEventListener('afterprint', restore)
    }
  }, [])

  return null
}
