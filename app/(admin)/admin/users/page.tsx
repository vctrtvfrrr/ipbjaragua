import { Plus } from 'lucide-react'
import Link from 'next/link'
import { UserStatusActionButton } from '@/components/admin/UserStatusActionButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { listUsers, type UserStatus } from '@/db/queries/users'
import { requirePageRead } from '@/lib/auth/require-page-read'

const STATUS_LABELS: Record<UserStatus, string> = {
  pending: 'Convidado',
  active: 'Ativo',
  disabled: 'Desabilitado',
}

const STATUS_VARIANTS: Record<UserStatus, 'default' | 'secondary' | 'outline'> = {
  pending: 'secondary',
  active: 'default',
  disabled: 'outline',
}

export default async function AdminUsersPage() {
  const currentUser = await requirePageRead('users')
  const users = await listUsers()

  const canCreate = currentUser.can('users', 'create')
  const canUpdate = currentUser.can('users', 'update')
  const canDelete = currentUser.can('users', 'delete')

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-normal">Usuários</h2>
        {canCreate ? (
          <Button render={<Link href="/admin/users/new" />}>
            <Plus data-icon="inline-start" />
            Novo convite
          </Button>
        ) : null}
      </div>

      {users.length === 0 ? (
        <div className="text-muted-foreground grid gap-4 rounded-lg border py-12 text-center text-sm">
          <p>Nenhum usuário ainda.</p>
          {canCreate ? (
            <div>
              <Button render={<Link href="/admin/users/new" />}>Criar o primeiro convite</Button>
            </div>
          ) : null}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const label = user.name || user.email
              const isSelf = user.id === currentUser.id

              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium whitespace-normal">{label}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[user.status]}>{STATUS_LABELS[user.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {canUpdate ? (
                        <Button variant="outline" size="sm" render={<Link href={`/admin/users/${user.id}/edit`} />}>
                          Editar
                        </Button>
                      ) : null}
                      {canDelete && user.status === 'pending' ? (
                        <UserStatusActionButton mode="cancel" user={{ id: user.id, label }} />
                      ) : null}
                      {canUpdate && user.status === 'active' && !isSelf ? (
                        <UserStatusActionButton mode="disable" user={{ id: user.id, label }} />
                      ) : null}
                      {canUpdate && user.status === 'disabled' ? (
                        <UserStatusActionButton mode="reactivate" user={{ id: user.id, label }} />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
