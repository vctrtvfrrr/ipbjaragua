'use client'

import { Ban, RotateCcw, X } from 'lucide-react'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  cancelInviteFormAction,
  disableUserFormAction,
  reactivateUserFormAction,
} from '@/app/(admin)/admin/users/form-actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { ActionState } from '@/lib/entity-action'
import { FormError } from './FormFeedback'

const INITIAL_STATE: ActionState = { status: 'idle' }

type Props = {
  user: { id: number; label: string }
  mode: 'disable' | 'reactivate' | 'cancel'
}

const CONFIG = {
  disable: {
    action: disableUserFormAction,
    icon: Ban,
    label: 'Desabilitar',
    pending: 'Desabilitando...',
    title: 'Desabilitar usuário',
    description: (label: string) => `Tem certeza que deseja desabilitar ${label}?`,
    toast: 'Usuário desabilitado',
    variant: 'destructive' as const,
  },
  reactivate: {
    action: reactivateUserFormAction,
    icon: RotateCcw,
    label: 'Reativar',
    pending: 'Reativando...',
    title: 'Reativar usuário',
    description: (label: string) => `Reativar ${label} com as permissões atuais?`,
    toast: 'Usuário reativado',
    variant: 'outline' as const,
  },
  cancel: {
    action: cancelInviteFormAction,
    icon: X,
    label: 'Cancelar convite',
    pending: 'Cancelando...',
    title: 'Cancelar convite',
    description: (label: string) => `Tem certeza que deseja cancelar o convite de ${label}?`,
    toast: 'Convite cancelado',
    variant: 'destructive' as const,
  },
}

export function UserStatusActionButton({ user, mode }: Props) {
  const config = CONFIG[mode]
  const Icon = config.icon
  const [state, formAction, isPending] = useActionState(config.action, INITIAL_STATE)
  const formError = state.status === 'error' ? state.formError : undefined

  useEffect(() => {
    if (state.status === 'success') toast.success(config.toast)
  }, [state.status, config.toast])

  return (
    <Dialog>
      <DialogTrigger render={<Button variant={config.variant} size="sm" />}>
        <Icon data-icon="inline-start" />
        {config.label}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description(user.label)}</DialogDescription>
        </DialogHeader>
        <FormError message={formError} />
        <form action={formAction}>
          <input type="hidden" name="id" value={user.id} />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancelar</DialogClose>
            <Button type="submit" variant={config.variant} disabled={isPending}>
              {isPending ? config.pending : config.label}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
