import { LogIn } from 'lucide-react'
import BrandMark from '@/components/brand/BrandMark'
import { Button } from '@/components/ui/button'
import { CHURCH_NAME } from '@/lib/og/config'
import { startGoogleLogin } from './actions'

const GENERIC_LOGIN_ERROR = 'Não foi possível entrar. Tente novamente ou fale com a liderança.'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const params = await searchParams

  return (
    <main className="bg-background text-foreground grid min-h-screen grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1">
      <div className="bg-brand-sky flex items-center justify-center px-6 py-12 lg:py-16">
        <BrandMark variant="vertical" alt={CHURCH_NAME} className="h-40 w-auto lg:h-72" priority />
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <section className="grid w-full max-w-sm gap-6">
          <div className="grid gap-2">
            <p className="eyebrow text-brand-ridge">Painel administrativo</p>
            <h1 className="text-2xl font-semibold tracking-normal">Entrar</h1>
            <p className="text-muted-foreground text-sm">
              O acesso é restrito à liderança. Use a conta Google cadastrada pela secretaria.
            </p>
          </div>

          {params.erro === 'login' ? (
            <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
              {GENERIC_LOGIN_ERROR}
            </p>
          ) : null}

          <form action={startGoogleLogin}>
            <Button type="submit" className="h-11 w-full">
              <LogIn data-icon="inline-start" />
              Entrar com Google
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
