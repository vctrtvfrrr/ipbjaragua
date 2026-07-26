'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { MenuIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BrandMark from '@/components/brand/BrandMark'
import { Button } from '@/components/ui/button'
import { PUBLIC_NAV } from '@/lib/public-nav'
import { cn } from '@/lib/utils'
import { CHURCH_NAME } from '@/lib/og/config'

function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function SiteHeader() {
  const pathname = usePathname()
  const headerRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const onScroll = () => header.toggleAttribute('data-scrolled', window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      ref={headerRef}
      className="data-scrolled:shadow-[0_1px_0_var(--border),0_6px_16px_-12px_rgb(6_71_137/0.35)] sticky top-0 z-40 bg-white transition-shadow duration-200 print:hidden"
    >
      <div className="container mx-auto flex h-20 items-center justify-between gap-6 px-5 md:px-8">
        <Link href="/" aria-label={`${CHURCH_NAME} — Início`} className="flex items-center">
          <BrandMark variant="horizontal" className="hidden h-14 w-auto md:block" priority />
          <BrandMark variant="symbol" className="h-9 w-auto md:hidden" priority />
        </Link>

        <nav aria-label="Navegação principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {PUBLIC_NAV.map((item) => {
              const current = isCurrent(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'hover:text-brand-ridge flex min-h-11 items-center border-b-2 px-3 pt-1 font-bold transition-colors',
                      current ? 'border-brand-accent text-brand-ridge' : 'text-brand-deep border-transparent'
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Dialog.Trigger
            render={<Button variant="ghost" size="icon" className="size-11 md:hidden" />}
            aria-label="Abrir navegação"
          >
            <MenuIcon />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0 fixed inset-0 z-50 bg-black/30 duration-200" />
            <Dialog.Popup className="data-closed:animate-out data-closed:slide-out-to-right data-open:animate-in data-open:slide-in-from-right fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white duration-200 outline-none">
              <div className="flex h-16 items-center justify-between px-4">
                <Dialog.Title className="eyebrow text-brand-ridge">Navegação</Dialog.Title>
                <Dialog.Close render={<Button variant="ghost" size="icon" className="size-11" />} aria-label="Fechar navegação">
                  <XIcon />
                </Dialog.Close>
              </div>
              <nav aria-label="Navegação principal" className="px-2 py-2">
                <ul className="flex flex-col">
                  {PUBLIC_NAV.map((item) => {
                    const current = isCurrent(pathname, item.href)
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={current ? 'page' : undefined}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            'flex min-h-12 items-center border-l-2 px-4 text-base font-bold',
                            current ? 'border-brand-accent text-brand-ridge bg-brand-sky' : 'text-brand-deep border-transparent'
                          )}
                        >
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  )
}
