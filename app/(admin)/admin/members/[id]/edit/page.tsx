import { forbidden, notFound } from 'next/navigation'
import { MemberForm } from '@/components/admin/MemberForm'
import { getMemberById } from '@/db/queries/members'
import { requirePageRead } from '@/lib/auth/require-page-read'

type EditMemberPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditMemberPage({ params }: EditMemberPageProps) {
  const user = await requirePageRead('members')
  if (!user.can('members', 'update')) forbidden()

  const { id } = await params
  const member = await getMemberById(Number(id))
  if (!member) notFound()

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-semibold tracking-normal">Editar membro</h2>
      <MemberForm mode="edit" member={member} />
    </section>
  )
}
