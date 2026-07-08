import { forbidden } from 'next/navigation'
import { MemberForm } from '@/components/admin/MemberForm'
import { requirePageRead } from '@/lib/auth/require-page-read'

export default async function NewMemberPage() {
  const user = await requirePageRead('members')
  if (!user.can('members', 'create')) forbidden()

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Novo membro</h2>
      <MemberForm mode="create" />
    </section>
  )
}
