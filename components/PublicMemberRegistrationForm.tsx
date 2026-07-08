'use client'

import { useActionState, useState } from 'react'
import { submitPublicMemberRegistration } from '@/app/(public)/members/register/actions'
import { MemberDateField, MemberSelectField, MemberTextField } from '@/components/MemberFormFields'
import { Button } from '@/components/ui/button'
import { Form, FormActions } from '@/components/ui/form'
import type { ActionState } from '@/lib/entity-action'
import { MARITAL_STATUSES, requiresMarriageFields } from '@/lib/member'
import { FormError } from './admin/FormFeedback'

const INITIAL_STATE: ActionState = { status: 'idle' }

export function PublicMemberRegistrationForm() {
  const [state, formAction, isPending] = useActionState(submitPublicMemberRegistration, INITIAL_STATE)
  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const values = state.status === 'error' ? state.values : undefined
  const formError = state.status === 'error' ? state.formError : undefined
  const [maritalStatus, setMaritalStatus] = useState(values?.marital_status ?? '')
  const marriageFieldsRequired = requiresMarriageFields(maritalStatus)

  if (state.status === 'success') {
    return (
      <div className="rounded-lg border bg-green-50 p-6 text-green-950">
        <h2 className="mb-2 text-xl font-semibold tracking-normal">Cadastro recebido</h2>
        <p>Seus dados foram enviados para revisão da secretaria da igreja.</p>
        {state.warning ? <p className="mt-3 text-sm">{state.warning}</p> : null}
      </div>
    )
  }

  return (
    <Form action={formAction} className="grid gap-4">
      <FormError message={formError} />
      <input className="hidden" tabIndex={-1} autoComplete="off" name="website" defaultValue="" />

      <div className="grid gap-4 md:grid-cols-2">
        <MemberTextField
          name="email"
          label="E-mail"
          type="email"
          value={values?.email ?? ''}
          error={fieldErrors?.email}
          required
        />
        <MemberTextField
          name="full_name"
          label="Nome completo"
          value={values?.full_name ?? ''}
          error={fieldErrors?.full_name}
          required
        />
        <MemberDateField
          name="birth_date"
          label="Data de nascimento"
          value={values?.birth_date ?? ''}
          error={fieldErrors?.birth_date}
          required
        />
        <MemberTextField
          name="birth_place"
          label="Local de nascimento"
          value={values?.birth_place ?? ''}
          error={fieldErrors?.birth_place}
        />
        <MemberTextField
          name="nationality"
          label="Nacionalidade"
          value={values?.nationality ?? ''}
          error={fieldErrors?.nationality}
        />
        <MemberTextField name="mother" label="Nome da mãe" value={values?.mother ?? ''} error={fieldErrors?.mother} />
        <MemberTextField name="father" label="Nome do pai" value={values?.father ?? ''} error={fieldErrors?.father} />
        <MemberTextField
          name="profession"
          label="Profissão"
          value={values?.profession ?? ''}
          error={fieldErrors?.profession}
        />
        <MemberTextField
          name="education"
          label="Escolaridade"
          value={values?.education ?? ''}
          error={fieldErrors?.education}
        />
        <MemberSelectField
          name="marital_status"
          label="Estado civil"
          value={values?.marital_status ?? ''}
          options={MARITAL_STATUSES.map((status) => [status, status])}
          error={fieldErrors?.marital_status}
          required
          onChange={setMaritalStatus}
        />
        <MemberTextField
          name="spouse"
          label="Nome do cônjuge"
          value={values?.spouse ?? ''}
          error={fieldErrors?.spouse}
          required={marriageFieldsRequired}
        />
        <MemberDateField
          name="wedding_date"
          label="Data de casamento"
          value={values?.wedding_date ?? ''}
          error={fieldErrors?.wedding_date}
          required={marriageFieldsRequired}
        />
        <MemberTextField
          name="address_street"
          label="Endereço/rua"
          value={values?.address_street ?? ''}
          error={fieldErrors?.address_street}
          required
        />
        <MemberTextField
          name="address_number"
          label="Número"
          value={values?.address_number ?? ''}
          error={fieldErrors?.address_number}
          required
        />
        <MemberTextField
          name="address_complement"
          label="Complemento"
          value={values?.address_complement ?? ''}
          error={fieldErrors?.address_complement}
        />
        <MemberTextField
          name="phone"
          label="Celular/Telefone"
          value={values?.phone ?? ''}
          error={fieldErrors?.phone}
          required
        />
        <MemberTextField
          name="home_church"
          label="Igreja de origem"
          value={values?.home_church ?? ''}
          error={fieldErrors?.home_church}
          required
        />
        <MemberTextField
          name="baptism_year"
          label="Ano do batismo"
          inputMode="numeric"
          value={values?.baptism_year ?? ''}
          error={fieldErrors?.baptism_year}
        />
        <MemberTextField
          name="baptism_place"
          label="Local do batismo"
          value={values?.baptism_place ?? ''}
          error={fieldErrors?.baptism_place}
        />
        <MemberTextField
          name="prof_faith_year"
          label="Ano da profissão de fé"
          inputMode="numeric"
          value={values?.prof_faith_year ?? ''}
          error={fieldErrors?.prof_faith_year}
        />
        <MemberTextField
          name="prof_faith_place"
          label="Local da profissão de fé"
          value={values?.prof_faith_place ?? ''}
          error={fieldErrors?.prof_faith_place}
        />
      </div>

      <FormActions>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Enviando…' : 'Enviar cadastro'}
        </Button>
      </FormActions>
    </Form>
  )
}
