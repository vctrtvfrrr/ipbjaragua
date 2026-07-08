import { Resend } from 'resend'

export type ResendConfig = {
  apiKey: string
  from: string
}

export type EmailEnv = Record<string, string | undefined>

export type EmailMessage = {
  from: string
  to: string
  subject: string
  text: string
}

export type SendMail = (message: EmailMessage, config: ResendConfig) => Promise<void>

export function getResendConfig(env: EmailEnv = process.env): ResendConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim()
  const from = env.EMAIL_FROM?.trim()

  if (!apiKey || !from) return null

  return { apiKey, from }
}

export async function sendEmail(
  message: Omit<EmailMessage, 'from'>,
  deps: { env?: EmailEnv; sendMail?: SendMail } = {}
) {
  const config = getResendConfig(deps.env)
  if (!config) return false

  await (deps.sendMail ?? realSendMail)({ ...message, from: config.from }, config)
  return true
}

async function realSendMail(message: EmailMessage, config: ResendConfig): Promise<void> {
  const { error } = await new Resend(config.apiKey).emails.send(message)
  if (error) throw error
}
