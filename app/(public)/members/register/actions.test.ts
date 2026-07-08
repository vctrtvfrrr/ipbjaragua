import { eq } from 'drizzle-orm'
import { describe, expect, it, vi } from 'vitest'
import { members } from '@/db/schema'
import { createTestDb } from '@/tests/db'
import { executePublicMemberRegistration } from './actions'

function formData(entries: [string, string][]) {
  const data = new FormData()
  for (const [name, value] of entries) data.append(name, value)
  return data
}

function publicForm(overrides: Partial<Record<string, string>> = {}) {
  return formData(
    Object.entries({
      website: '',
      email: 'visitante@example.com',
      full_name: 'Visitante Exemplo',
      birth_date: '1991-04-05',
      birth_place: 'Jaraguá',
      nationality: 'Brasileira',
      mother: 'Mãe',
      father: 'Pai',
      profession: 'Profissão',
      education: 'Médio',
      marital_status: 'Solteiro(a)',
      spouse: '',
      wedding_date: '',
      address_street: 'Rua Dois',
      address_number: '45',
      address_complement: '',
      phone: '11988888888',
      home_church: 'nenhuma',
      baptism_year: '',
      baptism_place: '',
      prof_faith_year: '',
      prof_faith_place: '',
      ...overrides,
    })
  )
}

describe('public member registration', () => {
  it('creates a pending member and sends the summary email', async () => {
    const db = await createTestDb()
    const sendMail = vi.fn().mockResolvedValue(undefined)

    const state = await executePublicMemberRegistration(publicForm({ prof_faith_year: '2010' }), {
      db,
      ip: '127.0.0.1',
      rateLimit: { check: () => true },
      env: { RESEND_API_KEY: 're_key', EMAIL_FROM: 'IPB <no-reply@example.com>' },
      sendMail,
    })

    expect(state).toEqual({ status: 'success' })
    const [row] = await db.select().from(members).where(eq(members.email, 'visitante@example.com'))
    expect(row).toMatchObject({ status: 'pending', sex: null, full_name: 'Visitante Exemplo' })
    const message = sendMail.mock.calls[0][0]
    expect(message).toMatchObject({ to: 'visitante@example.com' })
    expect(message.text).toContain('Resumo dos dados enviados:')
    expect(message.text).toContain('Nome: Visitante Exemplo')
    expect(message.text).toContain('Local de nascimento: Jaraguá')
    expect(message.text).toContain('Ano da profissão de fé: 2010')
  })

  it('requires spouse and wedding date for married members', async () => {
    const db = await createTestDb()

    const state = await executePublicMemberRegistration(
      publicForm({ marital_status: 'Casado(a)', spouse: '', wedding_date: '' }),
      { db, ip: '127.0.0.1', rateLimit: { check: () => true } }
    )

    expect(state.status).toBe('error')
    if (state.status === 'error') {
      expect(state.fieldErrors?.spouse).toEqual(['Cônjuge é obrigatório para este estado civil'])
      expect(state.fieldErrors?.wedding_date).toEqual(['Data de casamento é obrigatória para este estado civil'])
    }
  })

  it('accepts honeypot submissions without writing or sending email', async () => {
    const db = await createTestDb()
    const sendMail = vi.fn()
    const rateLimit = { check: vi.fn(() => false) }

    const state = await executePublicMemberRegistration(publicForm({ website: 'bot' }), {
      db,
      ip: '127.0.0.1',
      rateLimit,
      sendMail,
    })

    expect(state).toEqual({ status: 'success' })
    expect(rateLimit.check).not.toHaveBeenCalled()
    expect(sendMail).not.toHaveBeenCalled()
    expect(await db.select().from(members)).toEqual([])
  })

  it('blocks requests over the rate limit before writing', async () => {
    const db = await createTestDb()

    const state = await executePublicMemberRegistration(publicForm(), {
      db,
      ip: '127.0.0.1',
      rateLimit: { check: () => false },
    })

    expect(state).toEqual({ status: 'error', formError: 'Muitas tentativas. Tente novamente mais tarde.' })
    expect(await db.select().from(members)).toEqual([])
  })
})
