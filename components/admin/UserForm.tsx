'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { createInviteFormAction, updateUserFormAction } from '@/app/(admin)/admin/users/form-actions'
import { Button } from '@/components/ui/button'
import { Form, FormActions, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UserWithPermissions } from '@/db/queries/users'
import { USER_MANAGEMENT_PERMISSIONS } from '@/lib/authz'
import type { ActionState } from '@/lib/entity-action'
import { FieldError, FormError } from './FormFeedback'
import { PermissionGrid } from './PermissionGrid'

const INITIAL_STATE: ActionState = { status: 'idle' }

type Props = { currentUserId: number } & ({ mode: 'create' } | { mode: 'edit'; user: UserWithPermissions })

export function UserForm(props: Props) {
  const user = props.mode === 'edit' ? props.user : undefined
  const action = props.mode === 'edit' ? updateUserFormAction : createInviteFormAction
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE)
  const router = useRouter()

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const formError = state.status === 'error' ? state.formError : undefined
  const values = state.status === 'error' ? state.values : undefined
  const isSelf = user?.id === props.currentUserId

  useEffect(() => {
    if (state.status !== 'success') return
    toast.success(props.mode === 'edit' ? 'Usuário atualizado' : 'Convite criado')
    router.push('/admin/users')
  }, [state.status, props.mode, router])

  return (
    <Form action={formAction}>
      <FormError message={formError} />

      {user ? <input type="hidden" name="id" value={user.id} /> : null}

      {props.mode === 'create' ? (
        <FormField>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" defaultValue={values?.email ?? ''} />
          <FieldError messages={fieldErrors?.email} />
        </FormField>
      ) : user ? (
        <FormField>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" value={user.email} disabled />
        </FormField>
      ) : null}

      <FormField>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={values?.name ?? user?.name ?? ''} />
        <FieldError messages={fieldErrors?.name} />
      </FormField>

      <FormField>
        <Label>Permissões</Label>
        <PermissionGrid
          defaultPermissions={user?.permissions}
          lockedPermissions={isSelf ? USER_MANAGEMENT_PERMISSIONS : undefined}
          errors={fieldErrors?.permissions}
        />
      </FormField>

      <FormActions>
        <Button variant="outline" render={<Link href="/admin/users" />}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </FormActions>
    </Form>
  )
}
