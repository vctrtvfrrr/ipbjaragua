import BulletinGrid from '@/components/BulletinGrid'
import PageHeader from '@/components/public/PageHeader'
import { countBulletins, listBulletins } from '@/db/queries/bulletins'
import { today } from '@/lib/date'
import { institutionalMetadata } from '@/lib/og/metadata'
import { resolvePage, totalPages } from '@/lib/pagination'

export const metadata = institutionalMetadata('bulletins')

const PAGE_SIZE = 50

export default async function BulletinsPage({ searchParams }: PageProps<'/bulletins'>) {
  const { page: rawPage } = await searchParams
  const todayDate = today()
  const total = await countBulletins({ today: todayDate })
  const pages = totalPages(total, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const bulletinsList = await listBulletins({ page, pageSize: PAGE_SIZE, today: todayDate })

  return (
    <main>
      <PageHeader eyebrow="Publicações" title="Boletins semanais" />
      <section className="container mx-auto px-5 pt-6 pb-20 md:px-8">
        <BulletinGrid bulletins={bulletinsList} page={page} totalPages={pages} />
      </section>
    </main>
  )
}
