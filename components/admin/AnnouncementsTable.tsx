import Link from 'next/link'
import Image from 'next/image'
import { DeleteAnnouncementButton } from '@/components/admin/DeleteAnnouncementButton'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AnnouncementWithFeaturedImage } from '@/db/queries/announcements'
import { featuredImageUrl } from '@/lib/featured-image'
import { formatLongDatePtBR } from '@/lib/date'
import { resolveAnnouncementIcon } from '@/lib/announcement-icon'
import { cn } from '@/lib/utils'

type Props = {
  announcements: AnnouncementWithFeaturedImage[]
  todayDate: Date
  canUpdate: boolean
  canDelete: boolean
}

export function AnnouncementsTable({ announcements, todayDate, canUpdate, canDelete }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Imagem</TableHead>
          <TableHead>Exibir até</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Link</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {announcements.map((announcement) => {
          const expired = announcement.expires_at < todayDate
          const Icon = resolveAnnouncementIcon(announcement.icon)
          return (
            <TableRow key={announcement.id}>
              <TableCell className="font-medium whitespace-normal">
                <div className="flex items-center gap-2">
                  <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  {announcement.title}
                </div>
              </TableCell>
              <TableCell>
                {announcement.featuredImagePath ? (
                  <a href={featuredImageUrl(announcement.featuredImagePath)} target="_blank" rel="noreferrer">
                    <Image
                      className="aspect-video w-16 rounded object-cover"
                      src={featuredImageUrl(announcement.featuredImagePath)}
                      alt=""
                      width={96}
                      height={54}
                    />
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>{formatLongDatePtBR(announcement.expires_at)}</TableCell>
              <TableCell>
                {expired ? (
                  <Badge variant="secondary">Expirado</Badge>
                ) : (
                  <span className="text-muted-foreground">Vigente</span>
                )}
              </TableCell>
              <TableCell className="max-w-64 truncate">{announcement.url ?? '—'}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  {canUpdate ? (
                    <Link
                      href={`/admin/announcements/${announcement.id}/edit`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      Editar
                    </Link>
                  ) : null}
                  {canDelete ? (
                    <DeleteAnnouncementButton announcement={{ id: announcement.id, title: announcement.title }} />
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
