import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Forbidden() {
  return (
    <section className="grid w-full max-w-sm gap-4">
      <p className="text-muted-foreground text-sm">403</p>
      <h1 className="text-2xl font-semibold tracking-normal">Sem acesso</h1>
      <p className="text-muted-foreground text-sm">Você não tem permissão para ver esta página.</p>
      <Link href="/admin" className={cn(buttonVariants())}>
        Voltar ao painel
      </Link>
    </section>
  )
}
