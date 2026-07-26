import { ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Props = {
  href: string
  children: React.ReactNode
  className?: string
}

export default function ArrowLink({ href, children, className }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        'text-brand-deep inline-flex min-h-11 items-center gap-1.5 font-bold underline-offset-4 hover:underline',
        className
      )}
    >
      {children}
      <ChevronRightIcon aria-hidden="true" className="size-4" />
    </Link>
  )
}
