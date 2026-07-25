'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Member } from '@/db/queries/members'
import { formatISODate } from '@/lib/date'
import {
  countMembersByTab,
  filterMembersForAdmin,
  type MemberSortDirection,
  type MemberSortKey,
  type MemberTab,
} from '@/lib/member-admin'
import { MARITAL_STATUSES, MEMBER_STATUS_LABELS, SEXES } from '@/lib/member'
import { DeleteMemberButton } from './DeleteMemberButton'

const TABS: { key: MemberTab; label: string }[] = [
  { key: 'communicant', label: 'Membros Comungantes' },
  { key: 'nonCommunicant', label: 'Membros Não-Comungantes' },
  { key: 'former', label: 'Ex-Membros' },
  { key: 'pending', label: 'Pendente Aprovação' },
]

const SORTS: { key: MemberSortKey; label: string }[] = [
  { key: 'full_name', label: 'Nome completo' },
  { key: 'email', label: 'E-mail' },
  { key: 'birth_date', label: 'Data de nascimento' },
  { key: 'marital_status', label: 'Estado civil' },
  { key: 'wedding_date', label: 'Data de casamento' },
  { key: 'baptism_year', label: 'Ano do batismo' },
  { key: 'prof_faith_year', label: 'Ano da profissão de fé' },
  { key: 'status', label: 'Situação' },
]

export function MemberTable({
  members,
  canUpdate,
  canDelete,
}: {
  members: Member[]
  canUpdate: boolean
  canDelete: boolean
}) {
  const [tab, setTab] = useState<MemberTab>('communicant')
  const [sex, setSex] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('')
  const [status, setStatus] = useState('')
  const [sortKey, setSortKey] = useState<MemberSortKey>('full_name')
  const [direction, setDirection] = useState<MemberSortDirection>('asc')

  const counts = useMemo(() => countMembersByTab(members), [members])
  const visibleMembers = useMemo(
    () => filterMembersForAdmin(members, tab, { sex, marital_status: maritalStatus, status }, sortKey, direction),
    [members, tab, sex, maritalStatus, status, sortKey, direction]
  )
  const showMemberFilters = tab !== 'pending'

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <Button
            key={item.key}
            type="button"
            variant={tab === item.key ? 'default' : 'outline'}
            onClick={() => setTab(item.key)}
          >
            {item.label}
            {item.key === 'pending' ? <Badge variant="secondary">{counts.pending}</Badge> : null}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 rounded-lg border p-3 md:grid-cols-5">
        {showMemberFilters ? (
          <FilterSelect label="Sexo" value={sex} onChange={setSex} options={SEXES.map((value) => [value, value])} />
        ) : (
          <div />
        )}
        {showMemberFilters ? (
          <FilterSelect
            label="Estado civil"
            value={maritalStatus}
            onChange={setMaritalStatus}
            options={MARITAL_STATUSES.map((value) => [value, value])}
          />
        ) : (
          <div />
        )}
        {tab === 'former' ? (
          <FilterSelect
            label="Situação"
            value={status}
            onChange={setStatus}
            options={[
              ['transferred', 'Transferido'],
              ['deceased', 'Falecido'],
              ['removed', 'Removido'],
            ]}
          />
        ) : (
          <div />
        )}
        <FilterSelect
          label="Ordenar por"
          value={sortKey}
          onChange={(value) => setSortKey(value as MemberSortKey)}
          options={SORTS.filter((sort) => tab === 'former' || sort.key !== 'status').map((sort) => [
            sort.key,
            sort.label,
          ])}
        />
        <FilterSelect
          label="Direção"
          value={direction}
          onChange={(value) => setDirection(value as MemberSortDirection)}
          options={[
            ['asc', 'Ascendente'],
            ['desc', 'Descendente'],
          ]}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Nascimento</TableHead>
            <TableHead>Estado civil</TableHead>
            <TableHead>Batismo</TableHead>
            <TableHead>Profissão de fé</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleMembers.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium whitespace-normal">{member.full_name}</TableCell>
              <TableCell>{member.email ?? '—'}</TableCell>
              <TableCell>{member.birth_date ? formatISODate(member.birth_date) : '—'}</TableCell>
              <TableCell>{member.marital_status ?? '—'}</TableCell>
              <TableCell>{member.baptism_year ?? '—'}</TableCell>
              <TableCell>{member.prof_faith_year ?? '—'}</TableCell>
              <TableCell>{MEMBER_STATUS_LABELS[member.status]}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  {canUpdate ? (
                    <Link
                      href={`/admin/members/${member.id}/edit`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      Editar
                    </Link>
                  ) : null}
                  {canDelete ? <DeleteMemberButton member={member} /> : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly (readonly [string, string])[]
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Todos</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}
