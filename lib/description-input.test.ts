import { describe, expect, it } from 'vitest'
import { articleDescriptionInput, liturgyDescriptionInput } from './description-input'

describe('description generation input', () => {
  it('uses the complete article title and content', () => {
    expect(articleDescriptionInput('A graça', 'Corpo completo')).toBe('Título: A graça\n\nCorpo:\nCorpo completo')
  })

  it('prefers the first sermon theme and passages', () => {
    expect(
      liturgyDescriptionInput([
        {
          name: 'Palavra',
          moments: [
            {
              type: 'sermon',
              description: 'A graça',
              scripture_passages: [{ reference: 'Ef 2.8', text: 'Pela graça', version: 'ARA' }],
            },
          ],
        },
        { name: 'Outro', moments: [{ type: 'sermon', description: 'Ignorar', scripture_passages: [] }] },
      ])
    ).toBe('Tema do sermão: A graça\nLeituras do sermão:\nEf 2.8 (ARA): Pela graça')
  })

  it('falls back to every filled field in the first act', () => {
    expect(
      liturgyDescriptionInput([
        {
          name: 'Adoração',
          moments: [
            { type: 'prayer', description: 'Oração', sermon_speaker: 'Ana', scripture_passages: [] },
            { type: 'song', description: 'Santo, Santo', song_title: 'Castelo Forte', scripture_passages: [] },
          ],
        },
      ])
    ).toBe(
      'Ato: Adoração\nMomento 1 (prayer)\nDescrição: Oração\nPregador: Ana\nMomento 2 (song)\nDescrição: Santo, Santo\nMúsica: Castelo Forte'
    )
  })
})
