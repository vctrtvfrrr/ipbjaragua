import * as icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const DEFAULT_ANNOUNCEMENT_ICON = 'Pin'

export const ANNOUNCEMENT_ICON_CATALOG = [
  { name: 'Pin', label: 'Geral' },
  { name: 'Calendar', label: 'Calendário' },
  { name: 'Clock', label: 'Horário' },
  { name: 'Users', label: 'Comunidade' },
  { name: 'User', label: 'Pessoa' },
  { name: 'Church', label: 'Igreja' },
  { name: 'Music', label: 'Música' },
  { name: 'BookOpen', label: 'Estudo/Leitura' },
  { name: 'Heart', label: 'Cuidado' },
  { name: 'HandHeart', label: 'Solidariedade' },
  { name: 'CircleAlert', label: 'Atenção' },
  { name: 'Info', label: 'Informação' },
  { name: 'Megaphone', label: 'Comunicado' },
  { name: 'Utensils', label: 'Refeição' },
  { name: 'Bus', label: 'Transporte' },
  { name: 'MapPin', label: 'Local' },
  { name: 'ExternalLink', label: 'Link' },
] as const

export type AnnouncementIconName = (typeof ANNOUNCEMENT_ICON_CATALOG)[number]['name']

export const ANNOUNCEMENT_ICON_NAMES = ANNOUNCEMENT_ICON_CATALOG.map((icon) => icon.name)

export function isCuratedAnnouncementIcon(name: string): name is AnnouncementIconName {
  return (ANNOUNCEMENT_ICON_NAMES as readonly string[]).includes(name)
}

export function resolveAnnouncementIcon(name: string): LucideIcon {
  const icon = (icons as unknown as Record<string, LucideIcon>)[name]
  return icon ?? icons.Pin
}
