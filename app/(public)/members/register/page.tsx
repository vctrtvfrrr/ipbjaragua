import { PublicMemberRegistrationForm } from '@/components/PublicMemberRegistrationForm'
import PageHeader from '@/components/public/PageHeader'
import { institutionalMetadata } from '@/lib/og/metadata'

export const metadata = institutionalMetadata('register')

export default function PublicMemberRegistrationPage() {
  return (
    <main>
      <PageHeader eyebrow="Rol de membros" title="Cadastro de membro">
        <p className="mt-4 max-w-prose">Envie seus dados para revisão da secretaria da igreja.</p>
      </PageHeader>

      <div className="container mx-auto px-5 pt-6 pb-20 md:px-8">
        <div className="border-border rounded-xl border p-6 md:p-8">
          <PublicMemberRegistrationForm />
        </div>
      </div>
    </main>
  )
}
