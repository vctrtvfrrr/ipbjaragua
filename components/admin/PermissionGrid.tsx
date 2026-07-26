'use client'

import { useMemo, useState } from 'react'
import { FieldError } from '@/components/admin/FormFeedback'
import type { Permission } from '@/lib/authz'
import { PERMISSION_ACTIONS, PERMISSION_ENTITIES, type Action, type Entity } from '@/lib/authz'
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
}

const ACTION_LABELS: Record<Action, string> = {
  read: 'Ler',
  create: 'Criar',
  update: 'Editar',
  delete: 'Excluir',
}

type Props = {
  defaultPermissions?: Permission[]
  lockedPermissions?: Permission[]
  errors?: string[]
}

export function PermissionGrid({ defaultPermissions = [], lockedPermissions = [], errors }: Props) {
  const locked = useMemo(() => new Set(lockedPermissions.map(permissionFormValue)), [lockedPermissions])
  const [selected, setSelected] = useState(() => new Set(defaultPermissions.map(permissionFormValue)))

  function checked(entity: Entity, action: Action): boolean {
    return selected.has(permissionFormValue({ entity, action })) || locked.has(permissionFormValue({ entity, action }))
  }

  function disabled(entity: Entity, action: Action): boolean {
    if (locked.has(permissionFormValue({ entity, action }))) return true
    return action === 'read' && PERMISSION_ACTIONS.some((write) => write !== 'read' && checked(entity, write))
  }

  function toggle(entity: Entity, action: Action, isChecked: boolean) {
    setSelected((current) => {
      const next = new Set(current)
      const key = permissionFormValue({ entity, action })

      if (isChecked) {
        next.add(key)
        if (action !== 'read') next.add(permissionFormValue({ entity, action: 'read' }))
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
            {PERMISSION_ENTITIES.map((entity) => (
              <tr key={entity} className="border-b last:border-0">
                <th className="px-3 py-2 text-left font-medium">{ENTITY_LABELS[entity]}</th>
                {PERMISSION_ACTIONS.map((action) => {
                  const isChecked = checked(entity, action)
                  return (
                    <td key={action} className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        name="permissions"
                        value={permissionFormValue({ entity, action })}
                        checked={isChecked}
                        disabled={disabled(entity, action)}
                        onChange={(event) => toggle(entity, action, event.target.checked)}
                        className="border-input text-primary focus-visible:ring-ring size-4 rounded border align-middle focus-visible:ring-2"
                      />
                      {/* Disabled checkboxes are dropped from form submission; carry any
                          checked+locked permission (self-locked users:*) as hidden so the
                          anti-lockout guard still sees it. */}
                      {isChecked && disabled(entity, action) ? (
                        <input type="hidden" name="permissions" value={permissionFormValue({ entity, action })} />
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
