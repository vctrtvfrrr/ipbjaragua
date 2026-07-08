import type { InputHTMLAttributes } from 'react'
import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from './admin/FormFeedback'

type BaseFieldProps = {
  name: string
  label: string
  error?: string[]
  required?: boolean
}

export function MemberTextField({
  name,
  label,
  value,
  error,
  type = 'text',
  inputMode,
  required = false,
}: BaseFieldProps & {
  value: string
  type?: string
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <FormField>
      <RequiredLabel htmlFor={name} label={label} required={required} />
      <Input id={name} name={name} type={type} inputMode={inputMode} defaultValue={value} aria-required={required} />
      <FieldError messages={error} />
    </FormField>
  )
}

export function MemberDateField(props: BaseFieldProps & { value: string }) {
  return <MemberTextField {...props} type="date" />
}

export function MemberSelectField({
  name,
  label,
  value,
  options,
  error,
  required = false,
  onChange,
}: BaseFieldProps & {
  value: string
  options: readonly (readonly [string, string])[]
  onChange?: (value: string) => void
}) {
  return (
    <FormField>
      <RequiredLabel htmlFor={name} label={label} required={required} />
      <select
        id={name}
        name={name}
        defaultValue={value}
        aria-required={required}
        className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm"
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      >
        <option value="">Selecione</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
      <FieldError messages={error} />
    </FormField>
  )
}

function RequiredLabel({ htmlFor, label, required }: { htmlFor: string; label: string; required: boolean }) {
  return (
    <Label htmlFor={htmlFor}>
      {label}
      {required ? (
        <>
          {' '}
          <span aria-hidden="true">*</span>
        </>
      ) : null}
    </Label>
  )
}
