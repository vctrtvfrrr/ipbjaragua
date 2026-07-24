import Link from 'next/link'
import BrandMark from '@/components/brand/BrandMark'
import SocialLinks from '@/components/SocialLinks'
import { CHURCH_ADDRESS } from '@/lib/church'
import { CHURCH_NAME } from '@/lib/og/config'
import { PUBLIC_NAV } from '@/lib/public-nav'

export default function SiteFooter() {
  return (
    <footer className="bg-brand-deep text-brand-sky">
      <div className="container mx-auto grid gap-10 px-5 md:px-8 py-14 md:grid-cols-[auto_1fr_auto] md:gap-16">
        <div className="flex items-start gap-4">
          <BrandMark variant="symbol" className="h-20 w-auto" />
          <p className="font-serif text-2xl leading-tight">{CHURCH_NAME}</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <nav aria-label="Navegação do rodapé">
            <h2 className="eyebrow text-brand-accent-on-deep mb-4">Conteúdo</h2>
            <ul className="space-y-3">
              {PUBLIC_NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="underline-offset-4 hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow text-brand-accent-on-deep mb-4">Endereço</h2>
            <address className="space-y-1 not-italic">
              <p>{CHURCH_ADDRESS.street}</p>
              <p>
                {CHURCH_ADDRESS.district} — {CHURCH_ADDRESS.city}, {CHURCH_ADDRESS.state}
              </p>
              <p>CEP {CHURCH_ADDRESS.postalCode}</p>
            </address>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:items-end">
          <h2 className="eyebrow text-brand-accent-on-deep">Redes</h2>
          <div className="flex items-center gap-2">
            <SocialLinks />
          </div>
        </div>
      </div>

      <div className="border-brand-current/40 border-t">
        <p className="eyebrow text-brand-sky/80 container mx-auto px-5 md:px-8 py-6">
          &copy; 2026 {CHURCH_NAME} — Todos os direitos reservados
        </p>
      </div>
    </footer>
  )
}
