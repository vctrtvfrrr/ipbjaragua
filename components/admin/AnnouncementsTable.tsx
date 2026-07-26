import Link from 'next/link'
import Image from 'next/image'
import { DeleteAnnouncementButton } from '@/components/admin/DeleteAnnouncementButton'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Announcement } from '@/db/queries/announcements'
import { announcementFlyerUrl } from '@/lib/announcement-flyer-config'
import { formatLongDatePtBR } from '@/lib/date'
import { resolveAnnouncementIcon } from '@/lib/announcement-icon'
import { cn } from '@/lib/utils'

type Props = {
  announcements: Announcement[]
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
          <TableHead>Flyer</TableHead>
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
                {announcement.flyer_path ? (
                  <a href={announcementFlyerUrl(announcement.flyer_path)} target="_blank" rel="noreferrer">
                    <Image
                      className="max-h-16 w-16 rounded object-contain"
                      src={announcementFlyerUrl(announcement.flyer_path)}
                      alt=""
                      width={64}
                      height={80}
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
