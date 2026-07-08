import { Resend } from 'resend'

export const INVITE_EMAIL_WARNING = 'Convite criado, mas o e-mail de aviso não pôde ser enviado.'

export type ResendConfig = {
  apiKey: string
  from: string
}

export type SendInviteEmailInput = {
  to: string
  name: string | null
  panelUrl: URL
}

export type EmailEnv = Record<string, string | undefined>

export type EmailMessage = {
  from: string
  to: string
  subject: string
  text: string
}

export type SendMail = (message: EmailMessage, config: ResendConfig) => Promise<void>

type SendInviteEmailDeps = {
  env?: EmailEnv
  sendMail?: SendMail
}

export async function sendInviteEmail(
  input: SendInviteEmailInput,
  deps: SendInviteEmailDeps = {}
): Promise<string | undefined> {
  const config = getResendConfig(deps.env)
  if (!config) return INVITE_EMAIL_WARNING

  await (deps.sendMail ?? realSendMail)(
    {
      from: config.from,
      to: input.to,
      subject: 'Seu acesso ao painel da IPB Jaraguá foi habilitado',
      text: inviteEmailText(input.name, input.panelUrl),
    },
    config
  )
}

export function getResendConfig(env: EmailEnv = process.env): ResendConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim()
  const from = env.EMAIL_FROM?.trim()

  if (!apiKey || !from) return null

  return { apiKey, from }
}

function inviteEmailText(name: string | null, panelUrl: URL): string {
  const greeting = name ? `Olá, ${name}.` : 'Olá.'

  return `${greeting}

Seu acesso ao painel administrativo da IPB Jaraguá foi habilitado.

Você já pode entrar com sua conta Google pelo link:
${panelUrl.toString()}

Atenciosamente,
IPJS`
}

async function realSendMail(message: EmailMessage, config: ResendConfig): Promise<void> {
  const { error } = await new Resend(config.apiKey).emails.send(message)
  if (error) throw error
}
