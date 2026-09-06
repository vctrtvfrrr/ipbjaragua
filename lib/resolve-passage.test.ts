import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCurrentUser } from '@/lib/auth/current-user'
import { fetchBibleBook } from '@/lib/bible'
import { resolveScripturePassage } from './resolve-passage'

vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: vi.fn() }))
vi.mock('@/lib/bible', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/bible')>()),
  fetchBibleBook: vi.fn(),
}))

const psalm32 = {
  chapters: [
    {
      number: 32,
      verses: [
        { number: 7, text: 'Tu és o meu esconderijo' },
        { number: 10, text: 'Muitas são as dores' },
        { number: 11, text: 'Alegrai-vos no SENHOR' },
      ],
    },
  ],
}

function signedIn(canReturn: boolean) {
  vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, email: 'ana@example.com', name: 'Ana', can: () => canReturn })
}

describe('resolveScripturePassage', () => {
  beforeEach(() => {
    vi.mocked(fetchBibleBook).mockReset()
    signedIn(true)
  })

  it('returns the canonical reference, the cut text and how many verses it resolved', async () => {
    vi.mocked(fetchBibleBook).mockResolvedValue(psalm32)

    await expect(
      resolveScripturePassage({ action: 'create', reference: 'sl 32.7,10-11', version: 'ARA' })
    ).resolves.toEqual({
      reference: 'Salmo 32:7,10-11',
      text: 'Tu és o meu esconderijo\nMuitas são as dores\nAlegrai-vos no SENHOR',
      verses: 3,
    })
    expect(fetchBibleBook).toHaveBeenCalledWith('ARA', 'PSA')
  })

  it('denies whoever lacks the permission, without reaching the source', async () => {
    signedIn(false)

    await expect(
      resolveScripturePassage({ action: 'create', reference: 'Salmo 32:7', version: 'ARA' })
    ).resolves.toEqual({ error: 'Você não tem permissão para executar esta ação.' })
    expect(fetchBibleBook).not.toHaveBeenCalled()
  })

  it('turns a source failure into a friendly message instead of an exception', async () => {
    vi.mocked(fetchBibleBook).mockRejectedValue(new Error('ECONNRESET'))

    await expect(
      resolveScripturePassage({ action: 'update', reference: 'Salmo 32:7', version: 'ARA' })
    ).resolves.toEqual({ error: 'Não foi possível buscar o texto agora. Tente novamente.' })
  })

  it('reports an unreadable reference without reaching the source', async () => {
    await expect(resolveScripturePassage({ action: 'create', reference: '2:1-5', version: 'ARA' })).resolves.toEqual({
      error: 'Informe o livro da referência bíblica.',
    })
    expect(fetchBibleBook).not.toHaveBeenCalled()
  })

  it('refuses to search a Versão outside the offered list', async () => {
    await expect(
      resolveScripturePassage({ action: 'create', reference: 'Salmo 32:7', version: 'Bíblia Online' })
    ).resolves.toEqual({ error: 'Escolha uma Versão para buscar o texto.' })
    expect(fetchBibleBook).not.toHaveBeenCalled()
  })

  it('reports a reference the chosen Versão does not cover', async () => {
    vi.mocked(fetchBibleBook).mockResolvedValue({ chapters: [] })

    await expect(
      resolveScripturePassage({ action: 'create', reference: 'Salmo 32:7', version: 'NVI' })
    ).resolves.toEqual({ error: 'Não encontramos esta referência na Versão escolhida.' })
  })
})
