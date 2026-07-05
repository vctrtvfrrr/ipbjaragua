import type { Permission } from '@/lib/authz'

export function permissionFormValue(permission: Permission): string {
  return `${permission.entity}:${permission.action}`
}
