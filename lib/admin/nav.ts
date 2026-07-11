import type { Entity } from '@/lib/authz'

export type AdminNavItem = {
  entity: Entity
  label: string
  href?: string
}

export const ADMIN_NAV: AdminNavItem[] = [
  { entity: 'bulletins', label: 'Boletins', href: '/admin/bulletins' },
  { entity: 'articles', label: 'Artigos', href: '/admin/articles' },
  { entity: 'featured_images', label: 'Imagens Destacadas', href: '/admin/featured-images' },
  { entity: 'liturgies', label: 'Liturgias', href: '/admin/liturgies' },
  { entity: 'agenda', label: 'Agenda Semanal', href: '/admin/agenda' },
  { entity: 'announcements', label: 'Avisos', href: '/admin/announcements' },
  { entity: 'members', label: 'Rol de Membros', href: '/admin/members' },
  { entity: 'songs', label: 'Cânticos', href: '/admin/songs' },
  { entity: 'users', label: 'Usuários', href: '/admin/users' },
]
