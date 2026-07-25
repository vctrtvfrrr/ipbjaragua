import { expect, test } from '@playwright/test'
import { authenticateAsE2eAdmin } from './seed-db'

test('blocks an unauthenticated visitor from /admin', async ({ page }) => {
  await page.goto('/admin')

  await expect(page).toHaveURL(/\/login$/)
})

test('an authenticated user runs a full article CRUD that round-trips to the public list', async ({
  page,
  context,
  baseURL,
}) => {
  await authenticateAsE2eAdmin(context, baseURL)

  const title = `Artigo E2E ${Date.now()}`
  const editedTitle = `${title} editado`

  await page.goto('/admin/articles/new')
  await page.getByLabel('Título').fill(title)
  await page.locator('[contenteditable="true"]').click()
  await page.keyboard.type('Conteúdo criado pelo teste e2e.')
  await page.getByRole('button', { name: 'Salvar' }).click()

  await expect(page).toHaveURL(/\/admin\/articles$/)
  await expect(page.getByRole('cell', { name: title })).toBeVisible()

  await page.goto('/articles')
  await expect(page.getByText(title)).toBeVisible()

  await page.goto('/admin/articles')
  await page.getByRole('row', { name: title }).getByRole('link', { name: 'Editar' }).click()
  await expect(page).toHaveURL(/\/admin\/articles\/\d+\/edit$/)
  await page.getByLabel('Título').fill(editedTitle)
  await page.getByRole('button', { name: 'Salvar' }).click()

  await expect(page).toHaveURL(/\/admin\/articles$/)
  await expect(page.getByRole('cell', { name: editedTitle })).toBeVisible()

  await page.goto('/articles')
  await expect(page.getByText(editedTitle)).toBeVisible()

  await page.goto('/admin/articles')
  await page.getByRole('row', { name: editedTitle }).getByRole('button', { name: 'Excluir' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Excluir' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('row', { name: editedTitle })).toHaveCount(0)

  await page.goto('/articles')
  await expect(page.getByText(editedTitle)).toHaveCount(0)
})
