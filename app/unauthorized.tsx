import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-4 py-10">
      <section className="grid w-full max-w-sm gap-4">
        <p className="text-muted-foreground text-sm">401</p>
        <h1 className="text-2xl font-semibold tracking-normal">Acesso não autorizado</h1>
        <Button render={<Link href="/admin" />}>Voltar ao painel</Button>
      </section>
    </main>
  )
}
