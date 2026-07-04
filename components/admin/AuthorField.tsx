'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AuthorOption } from '@/db/queries/articles'
import { FieldError } from './FormFeedback'

type Props = {
  users: AuthorOption[]
  defaultUserId: number
  errors?: string[]
}

function authorLabel(user: AuthorOption): string {
  return user.name ?? user.email
}

export function AuthorField({ users, defaultUserId, errors }: Props) {
  const items = Object.fromEntries(users.map((user) => [String(user.id), authorLabel(user)]))

  return (
    <div className="group/field grid gap-2">
      <Label htmlFor="author_id">Autor</Label>
      <Select name="author_id" defaultValue={String(defaultUserId)} items={items}>
        <SelectTrigger id="author_id" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={String(user.id)}>
              {authorLabel(user)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError messages={errors} />
    </div>
  )
}
