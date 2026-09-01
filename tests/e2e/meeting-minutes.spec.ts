import { expect, test } from '@playwright/test'
import { authenticateAsE2eAdmin, E2E_MEETING_MINUTE } from './seed-db'

const YEAR = new Date().getUTCFullYear()
const NUMBER = E2E_MEETING_MINUTE.number + 1

// The whole life of an Ata in one pass: the states only make sense in sequence, and the Livro
// exists to bind what the earlier steps consolidated.
test('an authenticated user walks an Ata from creation to an exported Livro', async ({ page, context, baseURL }) => {
  test.slow()
  await authenticateAsE2eAdmin(context, baseURL)

  await page.goto('/admin/meeting-minutes/mesa-administrativa/new')
  await expect(page.getByLabel('Número')).toHaveValue(String(NUMBER))
  await page.getByLabel('Título', { exact: true }).fill('Reunião extraordinária')
  await page.getByLabel('Início da reunião').fill(`${YEAR}-06-07T19:30`)
  await page.getByLabel('Término da reunião').fill(`${YEAR}-06-07T21:00`)
  await page.getByLabel('Local').fill('Salão social')

  await page.getByRole('button', { name: 'Tópico', exact: true }).click()
  await page
    .getByLabel('Título do Tópico')
    .nth(0)
    .fill('Funcionamento orçamentário da JMN e expectativas para o campo em Jaraguá do Sul')
  await page.getByLabel('Título do Tópico').nth(1).fill('Orçamento anual')

  const editors = page.locator('[contenteditable="true"]')
  await expect(editors).toHaveCount(5)
  for (const [index, text] of [
    'Pastor João e Presbítero Pedro.',
    'A reunião foi aberta com oração.',
    'A reforma foi adiada.',
    'O orçamento foi aprovado.',
    'Nada mais havendo a tratar, a reunião foi encerrada.',
  ].entries()) {
    await editors.nth(index).click()
    await page.keyboard.type(text)
  }

  // The order of the Tópicos is the order the Mesa deliberated, so it is corrected before the
  // Ata is ever saved.
  await page.getByRole('button', { name: 'Mover para cima' }).nth(1).click()
  await expect(page.getByLabel('Título do Tópico').nth(0)).toHaveValue('Orçamento anual')

  await page.getByRole('button', { name: `Criar a ${NUMBER}ª Ata da Mesa Administrativa` }).click()
  await expect(page).toHaveURL(new RegExp(`/admin/meeting-minutes/mesa-administrativa\\?year=${YEAR}$`))

  const card = page.getByRole('article', { name: new RegExp(`${NUMBER}ª Ata Reunião extraordinária`) })
  await expect(card).toContainText('Aprovação pendente')
  await expect(card).toContainText('Orçamento anual')
  await expect(card).toContainText('Funcionamento orçamentário da JMN e expectativas para o campo em Jaraguá do Sul')

  const pending = page.waitForEvent('download')
  await card.getByRole('button', { name: 'Baixar PDF' }).click()
  expect((await pending).suggestedFilename()).toBe(`ata-${NUMBER}.pdf`)

  await card.getByRole('button', { name: 'Aprovar' }).click()
  const approval = page.getByRole('dialog')
  await approval.getByRole('button', { name: 'Aprovar definitivamente' }).click()
  await expect(approval).toBeHidden()
  await expect(card).toContainText('Aprovada')
  await expect(card.getByRole('link', { name: 'Editar' })).toHaveCount(0)

  await card.getByRole('button', { name: 'Regenerar PDF' }).click()
  const regeneration = page.getByRole('dialog')
  await regeneration.getByRole('button', { name: 'Regenerar PDF' }).click()
  await expect(regeneration).toBeHidden()

  const approved = page.waitForEvent('download')
  await card.getByRole('button', { name: 'Baixar PDF' }).click()
  expect((await approved).suggestedFilename()).toBe(`ata-${NUMBER}.pdf`)

  await page.getByRole('link', { name: `Atas de ${E2E_MEETING_MINUTE.year}` }).click()
  await expect(page.getByRole('article', { name: new RegExp(`${E2E_MEETING_MINUTE.number}ª Ata`) })).toBeVisible()

  await page.getByRole('button', { name: 'Exportar Livro de Atas' }).click()
  const exportDialog = page.getByRole('dialog')
  await exportDialog.getByLabel('Início do período').fill(`${E2E_MEETING_MINUTE.year}-01-01`)
  await exportDialog.getByLabel('Fim do período').fill(`${YEAR}-12-31`)
  await expect(exportDialog).toContainText(`${E2E_MEETING_MINUTE.number} a ${NUMBER}`)

  const book = page.waitForEvent('download')
  await exportDialog.getByRole('button', { name: 'Exportar Livro' }).click()
  expect((await book).suggestedFilename()).toBe(
    `livro-de-atas-mesa-administrativa-${E2E_MEETING_MINUTE.number}-${NUMBER}.pdf`
  )
  await expect(exportDialog).toBeHidden()
})
