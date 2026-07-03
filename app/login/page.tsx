import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { startGoogleLogin } from './actions'

const GENERIC_LOGIN_ERROR = 'Não foi possível entrar. Tente novamente ou fale com a liderança.'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const params = await searchParams

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-4 py-10">
      <section className="grid w-full max-w-sm gap-6">
        <div className="grid gap-2">
          <p className="text-muted-foreground text-sm">Painel administrativo</p>
          <h1 className="text-2xl font-semibold tracking-normal">IPB de Jaraguá do Sul</h1>
        </div>

        {params.erro === 'login' ? (
          <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
            {GENERIC_LOGIN_ERROR}
          </p>
        ) : null}

        <form action={startGoogleLogin}>
          <Button type="submit" className="w-full">
            <LogIn data-icon="inline-start" />
            Entrar com Google
          </Button>
        </form>
      </section>
    </main>
  )
}
