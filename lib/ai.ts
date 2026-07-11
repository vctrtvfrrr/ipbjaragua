import OpenAI from 'openai'

const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna'
const INSTRUCTIONS = `Escreva uma meta description em português brasileiro.
Entregue somente um parágrafo de texto cru, sem Markdown, aspas, título ou introdução, com no máximo 200 caracteres incluindo espaços.
Use sempre a primeira pessoa do plural. Nunca use primeira pessoa do singular nem terceira pessoa.
Reflita a mensagem central do conteúdo e priorize sua aplicação prática. Evite autores, contextualização histórica, detalhes secundários e referências bibliográficas.`

export async function generateDescription(input: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const response = await new OpenAI({ apiKey }).responses.create(
    { model: MODEL, instructions: INSTRUCTIONS, input, reasoning: { effort: 'low' } },
    { signal: AbortSignal.timeout(20_000) }
  )
  const description = response.output_text.trim()
  if (!isPlainParagraph(description)) throw new Error('Invalid response from OpenAI')
  return description
}

function isPlainParagraph(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 200 &&
    !/[\r\n]/.test(value) &&
    !/["“”]/.test(value) &&
    !/(^|\s)(#{1,6}|[-*>])\s/.test(value) &&
    !/\[[^\]]+\]\([^)]+\)/.test(value)
  )
}
