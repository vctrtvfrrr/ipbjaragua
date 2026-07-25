'use client'

import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { LogOut, MenuIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/logout/actions'
import BrandMark from '@/components/brand/BrandMark'
import { Button } from '@/components/ui/button'
import type { AdminNavItem } from '@/lib/admin/nav'
import { CHURCH_NAME } from '@/lib/og/config'
import { cn } from '@/lib/utils'

const PANEL_LABEL = 'Painel administrativo'

function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarContent({
  items,
  pathname,
  onNavigate,
  dense,
}: {
  items: AdminNavItem[]
  pathname: string
  onNavigate?: () => void
  dense: boolean
}) {
  return (
    <>
      <div
        className={cn(
          'border-border flex border-b px-4 py-4',
          dense ? 'flex-col items-start gap-3' : 'items-center gap-3'
        )}
      >
        <BrandMark variant="symbol" className="h-9 w-auto shrink-0" />
        <div className="min-w-0">
          <p className="eyebrow text-brand-ridge">{PANEL_LABEL}</p>
          <Link href="/" className="text-muted-foreground mt-1 block truncate text-sm hover:underline">
            {CHURCH_NAME}
          </Link>
        </div>
      </div>

      <nav aria-label={PANEL_LABEL} className="flex-1 overflow-y-auto p-2">
        <ul className="grid gap-0.5">
          {items.map((item) => {
            const current = item.href ? isCurrent(pathname, item.href) : false
            return (
              <li key={item.entity}>
                {item.href ? (
                  <Link
                    href={item.href}
                    aria-current={current ? 'page' : undefined}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center rounded-md px-3 text-sm',
                      dense ? 'min-h-9' : 'min-h-11',
                      current
                        ? 'bg-brand-sky text-brand-ridge font-medium'
                        : 'text-foreground hover:bg-muted transition-colors'
                    )}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      'text-muted-foreground flex items-center px-3 text-sm',
                      dense ? 'min-h-9' : 'min-h-11'
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-border border-t p-2">
        <form action={logout}>
          <Button type="submit" variant="ghost" className={cn('w-full justify-start', dense ? 'h-9' : 'h-11')}>
            <LogOut data-icon="inline-start" />
            Sair
          </Button>
        </form>
      </div>
    </>
  )
}

export default function AdminShell({ items, children }: { items: AdminNavItem[]; children: React.ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <aside className="border-border bg-card hidden w-60 shrink-0 flex-col border-r md:flex">
        <SidebarContent items={items} pathname={pathname} dense />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-card flex h-14 items-center gap-3 border-b px-3 md:hidden">
          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger
              render={<Button variant="ghost" size="icon" className="size-11" />}
              aria-label="Abrir navegação do painel"
            >
              <MenuIcon />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0 fixed inset-0 z-50 bg-black/30 duration-200" />
              <Dialog.Popup className="data-closed:animate-out data-closed:slide-out-to-left data-open:animate-in data-open:slide-in-from-left bg-card fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col duration-200 outline-none">
                <Dialog.Title className="sr-only">{PANEL_LABEL}</Dialog.Title>
                <Dialog.Close
                  render={<Button variant="ghost" size="icon" className="absolute top-2 right-2 size-11" />}
                  aria-label="Fechar navegação do painel"
                >
                  <XIcon />
                </Dialog.Close>
                <SidebarContent items={items} pathname={pathname} onNavigate={() => setMenuOpen(false)} dense={false} />
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>

          <BrandMark variant="symbol" className="h-8 w-auto" />
          <p className="eyebrow text-brand-ridge">{PANEL_LABEL}</p>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-6xl min-w-0">{children}</div>
        </main>
      </div>
    </div>
  )
}
