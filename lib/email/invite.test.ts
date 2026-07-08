import { describe, expect, it, vi } from 'vitest'
import { getResendConfig, INVITE_EMAIL_WARNING, sendInviteEmail } from './invite'

describe('invite email', () => {
  const env = {
    RESEND_API_KEY: 're_test_key',
    EMAIL_FROM: 'IPB Jaraguá <no-reply@example.com>',
  }

  it('reads complete Resend config from env', () => {
    expect(getResendConfig(env)).toEqual({
      apiKey: 're_test_key',
      from: 'IPB Jaraguá <no-reply@example.com>',
    })
  })

  it('returns null when Resend config is incomplete', () => {
    expect(getResendConfig({ ...env, RESEND_API_KEY: undefined })).toBeNull()
    expect(getResendConfig({ ...env, EMAIL_FROM: undefined })).toBeNull()
  })

  it('sends a plain-text invite email with the panel link', async () => {
    const sendMail = vi.fn().mockResolvedValue(undefined)

    await expect(
      sendInviteEmail(
        {
          to: 'novo@example.com',
          name: 'Novo',
          panelUrl: new URL('https://ipbjaragua.org.br/admin'),
        },
        { env, sendMail }
      )
    ).resolves.toBeUndefined()

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'IPB Jaraguá <no-reply@example.com>',
        to: 'novo@example.com',
        subject: 'Seu acesso ao painel da IPB Jaraguá foi habilitado',
        text: expect.stringContaining('https://ipbjaragua.org.br/admin'),
      }),
      expect.objectContaining({ apiKey: 're_test_key' })
    )
    expect(sendMail.mock.calls[0][0].text).toContain('Olá, Novo.')
  })

  it('does not call the mailer and returns a warning without Resend config', async () => {
    const sendMail = vi.fn()

    await expect(
      sendInviteEmail(
        {
          to: 'novo@example.com',
          name: null,
          panelUrl: new URL('https://ipbjaragua.org.br/admin'),
        },
        { env: {}, sendMail }
      )
    ).resolves.toBe(INVITE_EMAIL_WARNING)

    expect(sendMail).not.toHaveBeenCalled()
  })
})
