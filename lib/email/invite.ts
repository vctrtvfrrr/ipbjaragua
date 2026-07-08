import {
  getResendConfig,
  sendEmail,
  type EmailEnv,
  type EmailMessage,
  type ResendConfig,
  type SendMail,
} from './mailer'

export const INVITE_EMAIL_WARNING = 'Convite criado, mas o e-mail de aviso não pôde ser enviado.'

export type SendInviteEmailInput = {
  to: string
  name: string | null
  panelUrl: URL
}

type SendInviteEmailDeps = {
  env?: EmailEnv
  sendMail?: SendMail
}

export async function sendInviteEmail(
  input: SendInviteEmailInput,
  deps: SendInviteEmailDeps = {}
): Promise<string | undefined> {
  const sent = await sendEmail(
    {
      to: input.to,
      subject: 'Seu acesso ao painel da IPB Jaraguá foi habilitado',
      text: inviteEmailText(input.name, input.panelUrl),
    },
    deps
  )

  if (!sent) return INVITE_EMAIL_WARNING
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

export { getResendConfig, type EmailEnv, type EmailMessage, type ResendConfig, type SendMail }
