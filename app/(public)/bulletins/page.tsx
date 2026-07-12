import BulletinGrid from '@/components/BulletinGrid'
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
    <section className="container mx-auto py-10 xl:px-0">
      <h2 className="font-narrow mb-5 text-3xl text-green-900 uppercase">Boletins Semanais</h2>
      <main>
        <BulletinGrid bulletins={bulletinsList} page={page} totalPages={pages} />
      </main>
    </section>
  )
}
