import { LogOut } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { logout } from '@/app/logout/actions'
import { Button } from '@/components/ui/button'
import { ADMIN_NAV } from '@/lib/admin/nav'
import { type CurrentUser, getCurrentUser } from '@/lib/auth/current-user'

function AdminNav({ user }: { user: CurrentUser }) {
  const items = ADMIN_NAV.filter((item) => user.can(item.entity, 'read'))

  if (items.length === 0) return null

  return (
    <nav className="flex flex-wrap gap-1">
      {items.map((item) =>
        item.href ? (
          <Link key={item.entity} href={item.href} className="hover:bg-muted rounded-md border px-2 py-1 text-sm">
            {item.label}
          </Link>
        ) : (
          <span key={item.entity} className="text-muted-foreground rounded-md border px-2 py-1 text-sm">
            {item.label}
          </span>
        )
      )}
    </nav>
  )
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login/revoked')
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-sm">Painel administrativo</p>
              <h1 className="text-lg font-semibold tracking-normal">IPB de Jaraguá do Sul</h1>
            </div>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut data-icon="inline-start" />
                Sair
              </Button>
            </form>
          </div>
          <AdminNav user={user} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
