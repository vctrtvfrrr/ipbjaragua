import type { Metadata } from 'next'
import SiteFooter from '@/components/public/SiteFooter'
import SiteHeader from '@/components/public/SiteHeader'
import { CHURCH_NAME } from '@/lib/og/config'
import { resolveMetadataBase } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: await resolveMetadataBase(),
    title: { template: `%s — ${CHURCH_NAME}`, default: CHURCH_NAME },
  }
}

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  )
}
