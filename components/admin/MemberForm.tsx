'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { createMemberFormAction, updateMemberFormAction } from '@/app/(admin)/admin/members/form-actions'
import { MemberDateField, MemberSelectField, MemberTextField } from '@/components/MemberFormFields'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormActions } from '@/components/ui/form'
import type { Member } from '@/db/queries/members'
import { formatISODate } from '@/lib/date'
import type { ActionState } from '@/lib/entity-action'
import {
  ECCLESIASTICAL_MEMBER_STATUSES,
  MARITAL_STATUSES,
  MEMBER_STATUS_LABELS,
  SEXES,
  type MemberStatus,
} from '@/lib/member'
import { FormError } from './FormFeedback'

const INITIAL_STATE: ActionState = { status: 'idle' }

type Props = { mode: 'create' } | { mode: 'edit'; member: Member }

export function MemberForm(props: Props) {
  const member = props.mode === 'edit' ? props.member : undefined
  const action = props.mode === 'edit' ? updateMemberFormAction : createMemberFormAction
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE)
  const router = useRouter()

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const values = state.status === 'error' ? state.values : undefined
  const formError = state.status === 'error' ? state.formError : undefined

  useEffect(() => {
    if (state.status !== 'success') return
    if (state.warning) toast.warning(state.warning)
    else toast.success(props.mode === 'edit' ? 'Membro atualizado' : 'Membro criado')
    router.push('/admin/members')
  }, [state, props.mode, router])

  const statusOptions: readonly MemberStatus[] =
    member?.status === 'pending' ? ['pending', ...ECCLESIASTICAL_MEMBER_STATUSES] : ECCLESIASTICAL_MEMBER_STATUSES

  return (
    <Form action={formAction}>
      <FormError message={formError} />
      {props.mode === 'edit' ? <input type="hidden" name="id" value={props.member.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <MemberTextField
          name="full_name"
          label="Nome completo"
          value={value('full_name', values, member)}
          error={fieldErrors?.full_name}
        />
        <MemberTextField
          name="email"
          label="E-mail"
          type="email"
          value={value('email', values, member)}
          error={fieldErrors?.email}
        />
        <MemberDateField
          name="birth_date"
          label="Data de nascimento"
          value={dateValue('birth_date', values, member)}
          error={fieldErrors?.birth_date}
        />
        <MemberTextField
          name="birth_place"
          label="Local de nascimento"
          value={value('birth_place', values, member)}
          error={fieldErrors?.birth_place}
        />
        <MemberTextField
          name="nationality"
          label="Nacionalidade"
          value={value('nationality', values, member)}
          error={fieldErrors?.nationality}
        />
        <MemberSelectField
          name="sex"
          label="Sexo"
          value={value('sex', values, member)}
          options={SEXES.map((item) => [item, item])}
          error={fieldErrors?.sex}
        />
        <MemberSelectField
          name="marital_status"
          label="Estado civil"
          value={value('marital_status', values, member)}
          options={MARITAL_STATUSES.map((item) => [item, item])}
          error={fieldErrors?.marital_status}
        />
        <MemberTextField
          name="spouse"
          label="Cônjuge"
          value={value('spouse', values, member)}
          error={fieldErrors?.spouse}
        />
        <MemberDateField
          name="wedding_date"
          label="Data de casamento"
          value={dateValue('wedding_date', values, member)}
          error={fieldErrors?.wedding_date}
        />
        <MemberTextField
          name="mother"
          label="Nome da mãe"
          value={value('mother', values, member)}
          error={fieldErrors?.mother}
        />
        <MemberTextField
          name="father"
          label="Nome do pai"
          value={value('father', values, member)}
          error={fieldErrors?.father}
        />
        <MemberTextField
          name="profession"
          label="Profissão"
          value={value('profession', values, member)}
          error={fieldErrors?.profession}
        />
        <MemberTextField
          name="education"
          label="Escolaridade"
          value={value('education', values, member)}
          error={fieldErrors?.education}
        />
        <MemberTextField
          name="phone"
          label="Celular/Telefone"
          value={value('phone', values, member)}
          error={fieldErrors?.phone}
        />
        <MemberTextField
          name="address_street"
          label="Endereço/rua"
          value={value('address_street', values, member)}
          error={fieldErrors?.address_street}
        />
        <MemberTextField
          name="address_number"
          label="Número"
          value={value('address_number', values, member)}
          error={fieldErrors?.address_number}
        />
        <MemberTextField
          name="address_complement"
          label="Complemento"
          value={value('address_complement', values, member)}
          error={fieldErrors?.address_complement}
        />
        <MemberTextField
          name="home_church"
          label="Igreja de origem"
          value={value('home_church', values, member)}
          error={fieldErrors?.home_church}
        />
        <MemberTextField
          name="baptism_year"
          label="Ano do batismo"
          inputMode="numeric"
          value={value('baptism_year', values, member)}
          error={fieldErrors?.baptism_year}
        />
        <MemberTextField
          name="baptism_place"
          label="Local do batismo"
          value={value('baptism_place', values, member)}
          error={fieldErrors?.baptism_place}
        />
        <MemberTextField
          name="prof_faith_year"
          label="Ano da profissão de fé"
          inputMode="numeric"
          value={value('prof_faith_year', values, member)}
          error={fieldErrors?.prof_faith_year}
        />
        <MemberTextField
          name="prof_faith_place"
          label="Local da profissão de fé"
          value={value('prof_faith_place', values, member)}
          error={fieldErrors?.prof_faith_place}
        />
        <MemberDateField
          name="member_since"
          label="Membro desde"
          value={dateValue('member_since', values, member)}
          error={fieldErrors?.member_since}
        />
        <MemberDateField
          name="member_until"
          label="Membro até"
          value={dateValue('member_until', values, member)}
          error={fieldErrors?.member_until}
        />
        <MemberSelectField
          name="status"
          label="Status"
          value={value('status', values, member) || 'active'}
          options={statusOptions.map((item) => [item, MEMBER_STATUS_LABELS[item]])}
          error={fieldErrors?.status}
        />
      </div>

      {member?.status === 'pending' ? (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="notify_promotion" defaultChecked={values?.notify_promotion === 'on'} />
          Avisar o membro por e-mail ao promover para ativo
        </label>
      ) : null}

      <FormActions>
        <Link href="/admin/members" className={cn(buttonVariants({ variant: 'outline' }))}>
          Cancelar
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </FormActions>
    </Form>
  )
}

function value(name: keyof Member | 'notify_promotion', values?: Record<string, string>, member?: Member): string {
  const submitted = values?.[name]
  if (submitted !== undefined) return submitted
  const current = member?.[name as keyof Member]
  if (current === null || current === undefined) return ''
  if (current instanceof Date) return formatISODate(current)
  return String(current)
}

function dateValue(name: keyof Member, values?: Record<string, string>, member?: Member): string {
  return value(name, values, member)
}
