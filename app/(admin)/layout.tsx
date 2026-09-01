import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import { Toaster } from '@/components/ui/sonner'
import { ADMIN_NAV, visibleAdminNavItems } from '@/lib/admin/nav'
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

  const items = visibleAdminNavItems(ADMIN_NAV, user)

  return (
    <div className="bg-background text-foreground">
      <AdminShell items={items}>{children}</AdminShell>
      <Toaster />
    </div>
  )
}
