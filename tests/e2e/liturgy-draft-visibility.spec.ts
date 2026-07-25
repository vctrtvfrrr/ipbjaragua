import { expect, test } from '@playwright/test'
import { authenticateAsE2eAdmin, authenticateAsE2eLimitedUser, E2E_LITURGY_DRAFT } from './seed-db'

const DRAFT_SLUG = '2026-06-07-1800-culto-vespertino'
const BULLETIN_DATE = '2026-06-07'

test('a draft liturgy is 404 for an anonymous visitor', async ({ page }) => {
  const response = await page.goto(`/liturgies/${DRAFT_SLUG}`)

  expect(response?.status()).toBe(404)
})

test('a draft liturgy renders with the Rascunho banner for a user with read permission', async ({
  page,
  context,
  baseURL,
}) => {
  await authenticateAsE2eAdmin(context, baseURL)

  const response = await page.goto(`/liturgies/${DRAFT_SLUG}`)

  expect(response?.status()).toBe(200)
  await expect(page.getByText('Rascunho', { exact: false }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: E2E_LITURGY_DRAFT.theme })).toBeVisible()
})

test('a logged-in user without liturgies.read sees exactly what an anonymous visitor sees', async ({
  page,
  context,
  baseURL,
}) => {
  await authenticateAsE2eLimitedUser(context, baseURL)

  const response = await page.goto(`/liturgies/${DRAFT_SLUG}`)
  expect(response?.status()).toBe(404)

  await page.goto('/liturgies')
  await expect(page.getByText(E2E_LITURGY_DRAFT.theme)).toHaveCount(0)
})

test('the share image route refuses a draft liturgy', async ({ page }) => {
  const response = await page.goto(`/liturgies/${DRAFT_SLUG}/og`)

  expect(response?.status()).toBe(404)
})

test('the public listing hides a draft from an anonymous visitor and shows it with a badge to an operator', async ({
  page,
  context,
  baseURL,
}) => {
  await page.goto('/liturgies')
  await expect(page.getByText(E2E_LITURGY_DRAFT.theme)).toHaveCount(0)

  await authenticateAsE2eAdmin(context, baseURL)
  await page.goto('/liturgies')
  await expect(page.getByRole('heading', { name: E2E_LITURGY_DRAFT.theme })).toBeVisible()
  await expect(page.getByText('Rascunho', { exact: false }).first()).toBeVisible()
})

test('the bulletin page hides a draft liturgy from an anonymous visitor and shows it with a badge to an operator', async ({
  page,
  context,
  baseURL,
}) => {
  await page.goto(`/bulletins/${BULLETIN_DATE}`)
  await expect(page.getByText(E2E_LITURGY_DRAFT.theme)).toHaveCount(0)

  await authenticateAsE2eAdmin(context, baseURL)
  await page.goto(`/bulletins/${BULLETIN_DATE}`)
  await expect(page.getByText(E2E_LITURGY_DRAFT.theme)).toBeVisible()
  await expect(page.getByText('Rascunho', { exact: false }).first()).toBeVisible()
})

test('the bulletin Preview never shows a draft liturgy, even for an operator', async ({ page, context, baseURL }) => {
  await authenticateAsE2eAdmin(context, baseURL)

  await page.goto(`/bulletins/${BULLETIN_DATE}?preview=1`)

  await expect(page.getByText(E2E_LITURGY_DRAFT.theme)).toHaveCount(0)
})
