import { forbidden, notFound } from 'next/navigation'
import { UserForm } from '@/components/admin/UserForm'
import { getUserById } from '@/db/queries/users'
import { requirePageRead } from '@/lib/auth/require-page-read'

export default async function EditUserPage({ params }: PageProps<'/admin/users/[id]/edit'>) {
  const currentUser = await requirePageRead('users')
  if (!currentUser.can('users', 'update')) forbidden()

  const { id } = await params
  const user = await getUserById(Number(id))

  if (!user) {
    notFound()
  }

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Editar usuário</h2>
      <UserForm mode="edit" user={user} currentUserId={currentUser.id} />
    </section>
  )
}
