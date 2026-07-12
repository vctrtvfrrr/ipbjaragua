import { PublicMemberRegistrationForm } from '@/components/PublicMemberRegistrationForm'
import { institutionalMetadata } from '@/lib/og/metadata'

export const metadata = institutionalMetadata('register')

export default function PublicMemberRegistrationPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-10 xl:px-0">
      <div className="mb-8">
        <h1 className="font-narrow text-3xl text-green-900 uppercase">Cadastro de Membro</h1>
        <p className="text-muted-foreground mt-2">Envie seus dados para revisão da secretaria da igreja.</p>
      </div>
      <PublicMemberRegistrationForm />
    </main>
  )
}
