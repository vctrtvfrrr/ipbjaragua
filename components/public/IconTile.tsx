import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  icon: LucideIcon
  className?: string
  iconClassName?: string
}

/** Decorative: the text beside it already names what the item is, so it stays unannounced. */
export default function IconTile({ icon: Icon, className, iconClassName }: Props) {
  return (
    <span
      aria-hidden="true"
      className={cn('bg-brand-sky flex size-11 shrink-0 items-center justify-center rounded-lg', className)}
    >
      <Icon className={cn('text-brand-deep size-5', iconClassName)} />
    </span>
  )
}
