import type { CurrentUser } from '@/lib/auth/current-user'
import type { Entity } from '@/lib/authz'
import { MEETING_MINUTE_BOOKS } from '@/lib/meeting-minute-books'

export type AdminNavItem = {
  entity: Entity
  label: string
  href?: string
  scope?: string
  children?: AdminNavItem[]
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
  {
    entity: 'meeting_minutes',
    label: 'Livros de Atas',
    // A submenu, not a link: the order is the order of the closed list in code, deliberate
    // rather than alphabetical.
    children: MEETING_MINUTE_BOOKS.map((book) => ({
      entity: 'meeting_minutes' as const,
      label: book.label,
      href: `/admin/meeting-minutes/${book.slug}`,
      scope: book.slug,
    })),
  },
  { entity: 'users', label: 'Usuários', href: '/admin/users' },
]

// A parent with no visible child renders nothing at all: the section only ever offers a
// Usuário a Livro they can actually open, never a path that ends in acesso negado.
export function visibleAdminNavItems(items: AdminNavItem[], user: CurrentUser): AdminNavItem[] {
  return items
    .map((item) =>
      item.children ? { ...item, children: item.children.filter((child) => canReadNavItem(user, child)) } : item
    )
    .filter((item) => (item.children ? item.children.length > 0 : canReadNavItem(user, item)))
}

function canReadNavItem(user: CurrentUser, item: AdminNavItem): boolean {
  return user.can(item.entity, 'read', item.scope)
}
