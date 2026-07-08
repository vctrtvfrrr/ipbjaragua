import { expect, test, type BrowserContext } from '@playwright/test'
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from '../../lib/auth/session'
import { E2E_SESSION_SECRET, getE2eAdminUserId } from './seed-db'

async function authenticate(context: BrowserContext, baseURL: string | undefined) {
  const adminUserId = await getE2eAdminUserId()
  const token = await createSessionToken(adminUserId, E2E_SESSION_SECRET)

  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: token,
      url: baseURL ?? 'http://localhost:3210',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
    },
  ])
}

test('blocks an unauthenticated visitor from /admin', async ({ page }) => {
  await page.goto('/admin')

  await expect(page).toHaveURL(/\/login$/)
})

test('an authenticated user runs a full article CRUD that round-trips to the public list', async ({
  page,
  context,
  baseURL,
}) => {
  await authenticate(context, baseURL)

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
