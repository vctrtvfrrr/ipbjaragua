import { expect, test } from '@playwright/test'
import { E2E_LITURGY, FEATURED } from './seed-db'

const BULLETIN_DATE = '2026-06-07'

test('shows bulletin header with edition and year', async ({ page }) => {
  await page.goto(`/bulletins/${BULLETIN_DATE}`)

  await expect(page.getByRole('heading', { name: /07 de junho de 2026/ })).toBeVisible()
  await expect(page.getByText('70ª Edição — Ano II')).toBeVisible()
})

test('shows article section with link to article detail', async ({ page }) => {
  await page.goto(`/bulletins/${BULLETIN_DATE}`)

  await expect(page.getByText(FEATURED.title)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Leia mais' })).toHaveAttribute('href', `/articles/${FEATURED.slug}`)
})

test('shows liturgy link pointing to correct slug', async ({ page }) => {
  await page.goto(`/bulletins/${BULLETIN_DATE}`)

  await expect(
    page.getByRole('link', { name: E2E_LITURGY.theme }),
  ).toHaveAttribute('href', `/liturgies/${BULLETIN_DATE}-culto-solene`)
})

test('returns 404 for unknown date', async ({ page }) => {
  const response = await page.goto('/bulletins/1900-01-01')

  expect(response?.status()).toBe(404)
})
