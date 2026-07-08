import Link from 'next/link'
import { Plus } from 'lucide-react'
import { MemberTable } from '@/components/admin/MemberTable'
import { Button } from '@/components/ui/button'
import { listMembersForAdmin } from '@/db/queries/members'
import { requirePageRead } from '@/lib/auth/require-page-read'

export default async function AdminMembersPage() {
  const user = await requirePageRead('members')
  const members = await listMembersForAdmin()
  const canCreate = user.can('members', 'create')
  const canUpdate = user.can('members', 'update')
  const canDelete = user.can('members', 'delete')

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-normal">Membros</h2>
        {canCreate ? (
          <Button render={<Link href="/admin/members/new" />}>
            <Plus data-icon="inline-start" />
            Novo membro
          </Button>
        ) : null}
      </div>

      {members.length === 0 ? (
        <div className="text-muted-foreground grid gap-4 rounded-lg border py-12 text-center text-sm">
          <p>Nenhum membro ainda.</p>
          {canCreate ? (
            <div>
              <Button render={<Link href="/admin/members/new" />}>Criar o primeiro membro</Button>
            </div>
          ) : null}
        </div>
      ) : (
        <MemberTable members={members} canUpdate={canUpdate} canDelete={canDelete} />
      )}
    </section>
  )
}
