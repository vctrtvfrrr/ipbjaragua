import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import { Toaster } from '@/components/ui/sonner'
import { ADMIN_NAV } from '@/lib/admin/nav'
import { getCurrentUser } from '@/lib/auth/current-user'

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login/revoked')
  }

  const items = ADMIN_NAV.filter((item) => user.can(item.entity, 'read'))

  return (
    <div className="bg-background text-foreground">
      <AdminShell items={items}>{children}</AdminShell>
      <Toaster />
    </div>
  )
}
