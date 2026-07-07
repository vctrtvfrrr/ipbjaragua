import type { Entity } from '@/lib/authz'

export type AdminNavItem = {
  entity: Entity
  label: string
  href?: string
}

export const ADMIN_NAV: AdminNavItem[] = [
  { entity: 'bulletins', label: 'Boletins' },
  { entity: 'articles', label: 'Artigos', href: '/admin/articles' },
  { entity: 'liturgies', label: 'Liturgias', href: '/admin/liturgies' },
  { entity: 'announcements', label: 'Avisos', href: '/admin/announcements' },
  { entity: 'songs', label: 'Músicas', href: '/admin/songs' },
  { entity: 'members', label: 'Membros' },
  { entity: 'agenda', label: 'Agenda' },
  { entity: 'users', label: 'Usuários', href: '/admin/users' },
]
