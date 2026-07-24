import Link from 'next/link'
import PageHeader from '@/components/public/PageHeader'
import SectionHead from '@/components/public/SectionHead'
import { CHURCH_ADDRESS, CHURCH_MAP_EMBED_URL } from '@/lib/church'
import { institutionalMetadata } from '@/lib/og/metadata'

export const metadata = institutionalMetadata('location')

export default function Location() {
  return (
    <main>
      <PageHeader eyebrow="Onde nos encontrar" title="Visite-nos">
        <p className="mt-4 max-w-prose">
          Nossos cultos e atividades acontecem no endereço abaixo. A programação da semana está na{' '}
          <Link href="/" className="text-brand-deep underline underline-offset-4">
            página inicial
          </Link>
          .
        </p>
      </PageHeader>

      <div className="container mx-auto px-5 pt-6 pb-20 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-12">
          <div>
            <SectionHead>Endereço</SectionHead>
            <address className="space-y-1 text-lg not-italic">
              <p>{CHURCH_ADDRESS.street}</p>
              <p>{CHURCH_ADDRESS.district}</p>
              <p>
                {CHURCH_ADDRESS.city} — {CHURCH_ADDRESS.state}
              </p>
              <p className="text-muted-foreground">CEP {CHURCH_ADDRESS.postalCode}</p>
            </address>
          </div>

          <div>
            <SectionHead>Mapa</SectionHead>
            <iframe
              src={CHURCH_MAP_EMBED_URL}
              className="block h-96 w-full border-0"
              title="Mapa da localização da igreja"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
