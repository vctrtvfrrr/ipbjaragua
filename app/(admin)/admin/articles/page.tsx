import Link from 'next/link'
import { Plus } from 'lucide-react'
import { DeleteArticleButton } from '@/components/admin/DeleteArticleButton'
import Pagination from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { countArticles, listArticlesForAdmin } from '@/db/queries/articles'
import { requirePageRead } from '@/lib/auth/require-page-read'
import { formatLongDatePtBR } from '@/lib/date'
import { resolvePage, totalPages } from '@/lib/pagination'

const PAGE_SIZE = 20

export default async function AdminArticlesPage({ searchParams }: PageProps<'/admin/articles'>) {
  const user = await requirePageRead('articles')

  const { page: rawPage } = await searchParams
  const total = await countArticles()
  const pages = totalPages(total, PAGE_SIZE)
  const page = resolvePage(rawPage, pages)
  const articles = await listArticlesForAdmin({ page, pageSize: PAGE_SIZE })

  const canCreate = user.can('articles', 'create')
  const canUpdate = user.can('articles', 'update')
  const canDelete = user.can('articles', 'delete')

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-normal">Artigos</h2>
        {canCreate ? (
          <Button render={<Link href="/admin/articles/new" />}>
            <Plus data-icon="inline-start" />
            Novo artigo
          </Button>
        ) : null}
      </div>

      {total === 0 ? (
        <div className="text-muted-foreground grid gap-4 rounded-lg border py-12 text-center text-sm">
          <p>Nenhum artigo ainda.</p>
          {canCreate ? (
            <div>
              <Button render={<Link href="/admin/articles/new" />}>Criar o primeiro artigo</Button>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium whitespace-normal">{article.title}</TableCell>
                  <TableCell>{article.authorName ?? article.authorEmail}</TableCell>
                  <TableCell>{formatLongDatePtBR(article.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {canUpdate ? (
                        <Button
                          variant="outline"
                          size="sm"
                          render={<Link href={`/admin/articles/${article.id}/edit`} />}
                        >
                          Editar
                        </Button>
                      ) : null}
                      {canDelete ? <DeleteArticleButton article={{ id: article.id, title: article.title }} /> : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pages > 1 ? <Pagination page={page} totalPages={pages} basePath="/admin/articles" /> : null}
        </>
      )}
    </section>
  )
}
