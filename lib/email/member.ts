import { sendEmail, type EmailEnv, type SendMail } from './mailer'
import type { MemberInput, PublicMemberInput } from '@/db/queries/members'

export const MEMBER_CONFIRMATION_EMAIL_WARNING = 'Cadastro recebido, mas o e-mail de confirmação não pôde ser enviado.'
export const MEMBER_PROMOTION_EMAIL_WARNING = 'Membro atualizado, mas o e-mail de aviso não pôde ser enviado.'

type MemberEmailDeps = {
  env?: EmailEnv
  sendMail?: SendMail
}

export async function sendPublicMemberConfirmationEmail(
  input: PublicMemberInput,
  deps: MemberEmailDeps = {}
): Promise<string | undefined> {
  if (!input.email) return MEMBER_CONFIRMATION_EMAIL_WARNING

  const sent = await sendEmail(
    {
      to: input.email,
      subject: 'Recebemos seu cadastro na IPB Jaraguá',
      text: publicMemberConfirmationText(input),
    },
    deps
  )

  if (!sent) return MEMBER_CONFIRMATION_EMAIL_WARNING
}

export async function sendMemberPromotionEmail(
  input: MemberInput,
  deps: MemberEmailDeps = {}
): Promise<string | undefined> {
  if (!input.email) return MEMBER_PROMOTION_EMAIL_WARNING

  const sent = await sendEmail(
    {
      to: input.email,
      subject: 'Seu cadastro de membro foi revisado',
      text: `Olá, ${input.full_name}.

Seu cadastro de membro na IPB Jaraguá foi revisado e incluído no rol de membros.

Atenciosamente,
IPJS`,
    },
    deps
  )

  if (!sent) return MEMBER_PROMOTION_EMAIL_WARNING
}

function publicMemberConfirmationText(input: PublicMemberInput): string {
  const lines = [
    fieldLine('Nome', input.full_name),
    fieldLine('E-mail', input.email),
    fieldLine('Data de nascimento', formatDate(input.birth_date)),
    fieldLine('Local de nascimento', input.birth_place),
    fieldLine('Nacionalidade', input.nationality),
    fieldLine('Nome da mãe', input.mother),
    fieldLine('Nome do pai', input.father),
    fieldLine('Profissão', input.profession),
    fieldLine('Escolaridade', input.education),
    fieldLine('Estado civil', input.marital_status),
    fieldLine('Nome do cônjuge', input.spouse),
    fieldLine('Data de casamento', formatDate(input.wedding_date)),
    fieldLine('Endereço/rua', input.address_street),
    fieldLine('Número', input.address_number),
    fieldLine('Complemento', input.address_complement),
    fieldLine('Celular/Telefone', input.phone),
    fieldLine('Igreja de origem', input.home_church),
    fieldLine('Ano do batismo', formatNumber(input.baptism_year)),
    fieldLine('Local do batismo', input.baptism_place),
    fieldLine('Ano da profissão de fé', formatNumber(input.prof_faith_year)),
    fieldLine('Local da profissão de fé', input.prof_faith_place),
  ].filter((line): line is string => Boolean(line))

  return `Olá, ${input.full_name}.

Recebemos seu cadastro de membro e ele será revisado pela secretaria da igreja.

Resumo dos dados enviados:
${lines.join('\n')}

Atenciosamente,
IPJS`
}

function fieldLine(label: string, value: string | null): string | null {
  return value ? `${label}: ${value}` : null
}

function formatNumber(value: number | null): string | null {
  return value === null ? null : String(value)
}

function formatDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : ''
}
