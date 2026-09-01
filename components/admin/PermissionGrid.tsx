'use client'

import { useMemo, useState } from 'react'
import { FieldError } from '@/components/admin/FormFeedback'
import type { Permission } from '@/lib/authz'
import {
  actionsFor,
  isDeclaredPermission,
  PERMISSION_ACTIONS,
  PERMISSION_ENTITIES,
  scopesFor,
  type Action,
  type Entity,
} from '@/lib/authz'
import { meetingMinuteBookBySlug } from '@/lib/meeting-minute-books'
import { permissionFormValue } from '@/lib/permission-form'

const ENTITY_LABELS: Record<Entity, string> = {
  bulletins: 'Boletins',
  articles: 'Artigos',
  liturgies: 'Liturgias',
  announcements: 'Avisos',
  songs: 'Cânticos',
  members: 'Membros',
  agenda: 'Agenda',
  users: 'Usuários',
  featured_images: 'Imagens Destacadas',
  meeting_minutes: 'Atas',
}

const ACTION_LABELS: Record<Action, string> = {
  read: 'Ler',
  create: 'Criar',
  update: 'Editar',
  delete: 'Excluir',
}

type Target = { entity: Entity; scope: string; label: string }

// One row per (entidade, escopo) — a Livro of the Ata entity is its own row, named on the row,
// so the grid still shows a single kind of row even though the Ata now has several.
const TARGETS: Target[] = PERMISSION_ENTITIES.flatMap((entity) =>
  scopesFor(entity).map((scope) => ({
    entity,
    scope,
    label: scope
      ? `${ENTITY_LABELS[entity]} — ${meetingMinuteBookBySlug(scope)?.label ?? scope}`
      : ENTITY_LABELS[entity],
  }))
)

type Props = {
  defaultPermissions?: Permission[]
  lockedPermissions?: Permission[]
  errors?: string[]
}

export function PermissionGrid({ defaultPermissions = [], lockedPermissions = [], errors }: Props) {
  const locked = useMemo(() => new Set(lockedPermissions.map(permissionFormValue)), [lockedPermissions])
  const [selected, setSelected] = useState(() => new Set(defaultPermissions.map(permissionFormValue)))

  function checked(target: Target, action: Action): boolean {
    const key = permissionFormValue({ ...target, action })
    return selected.has(key) || locked.has(key)
  }

  function disabled(target: Target, action: Action): boolean {
    const key = permissionFormValue({ ...target, action })
    if (locked.has(key)) return true
    return action === 'read' && actionsFor(target.entity).some((write) => write !== 'read' && checked(target, write))
  }

  function toggle(target: Target, action: Action, isChecked: boolean) {
    setSelected((current) => {
      const next = new Set(current)
      const key = permissionFormValue({ ...target, action })

      if (isChecked) {
        next.add(key)
        if (action !== 'read') next.add(permissionFormValue({ ...target, action: 'read' }))
      } else {
        next.delete(key)
      }

      for (const lockedKey of locked) next.add(lockedKey)
      return next
    })
  }

  return (
    <div className="grid gap-2">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[34rem] text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="px-3 py-2 text-left font-medium">Alvo</th>
              {PERMISSION_ACTIONS.map((action) => (
                <th key={action} className="px-3 py-2 text-center font-medium">
                  {ACTION_LABELS[action]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TARGETS.map((target) => (
              <tr key={permissionFormValue({ ...target, action: 'read' })} className="border-b last:border-0">
                <th className="px-3 py-2 text-left font-medium">{target.label}</th>
                {PERMISSION_ACTIONS.map((action) => {
                  if (!isDeclaredPermission(target.entity, action)) {
                    return (
                      <td key={action} className="text-muted-foreground px-3 py-2 text-center">
                        <span aria-hidden="true">—</span>
                        <span className="sr-only">Não se aplica</span>
                      </td>
                    )
                  }

                  const isChecked = checked(target, action)
                  return (
                    <td key={action} className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        name="permissions"
                        value={permissionFormValue({ ...target, action })}
                        checked={isChecked}
                        disabled={disabled(target, action)}
                        onChange={(event) => toggle(target, action, event.target.checked)}
                        className="border-input text-primary focus-visible:ring-ring size-4 rounded border align-middle focus-visible:ring-2"
                      />
                      {/* Disabled checkboxes are dropped from form submission; carry any
                          checked+locked permission (self-locked users:*) as hidden so the
                          anti-lockout guard still sees it. */}
                      {isChecked && disabled(target, action) ? (
                        <input type="hidden" name="permissions" value={permissionFormValue({ ...target, action })} />
                      ) : null}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FieldError messages={errors} />
    </div>
  )
}
