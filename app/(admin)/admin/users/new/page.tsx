import { forbidden } from 'next/navigation'
import { UserForm } from '@/components/admin/UserForm'
import { requirePageRead } from '@/lib/auth/require-page-read'

export default async function NewUserPage() {
  const user = await requirePageRead('users')
  if (!user.can('users', 'create')) forbidden()

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Novo convite</h2>
      <UserForm mode="create" currentUserId={user.id} />
    </section>
  )
}
