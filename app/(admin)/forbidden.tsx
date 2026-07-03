import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Forbidden() {
  return (
    <section className="grid w-full max-w-sm gap-4">
      <p className="text-muted-foreground text-sm">403</p>
      <h1 className="text-2xl font-semibold tracking-normal">Sem acesso</h1>
      <p className="text-muted-foreground text-sm">Você não tem permissão para ver esta página.</p>
      <Button render={<Link href="/admin" />}>Voltar ao painel</Button>
    </section>
  )
}
