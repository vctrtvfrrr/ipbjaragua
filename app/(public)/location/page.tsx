import { MapPinIcon } from 'lucide-react'
import Link from 'next/link'
import IconTile from '@/components/public/IconTile'
import PageHeader from '@/components/public/PageHeader'
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
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="border-border self-start rounded-xl border p-6 md:p-8">
            <h2 className="text-brand-deep font-serif text-2xl">Endereço</h2>
            <div className="mt-6 flex gap-4">
              <IconTile icon={MapPinIcon} />
              <address className="space-y-1 text-lg not-italic">
                <p>{CHURCH_ADDRESS.street}</p>
                <p>{CHURCH_ADDRESS.district}</p>
                <p>
                  {CHURCH_ADDRESS.city} — {CHURCH_ADDRESS.state}
                </p>
                <p className="text-muted-foreground">CEP {CHURCH_ADDRESS.postalCode}</p>
              </address>
            </div>
          </div>

          <div className="border-border rounded-xl border p-6 md:p-8">
            <h2 className="text-brand-deep font-serif text-2xl">Mapa</h2>
            <iframe
              src={CHURCH_MAP_EMBED_URL}
              className="mt-6 block h-96 w-full rounded-lg border-0"
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
