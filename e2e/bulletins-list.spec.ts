import { expect, test } from '@playwright/test'
import { E2E_BULLETINS_COUNT } from './seed-db'

const NEWEST_EDITION = 70

test('lists every bulletin linking to its detail', async ({ page }) => {
  await page.goto('/bulletins')

  await expect(page.getByRole('link', { name: /07 de junho de 2026/ })).toBeVisible()
  await expect(page.locator('a[href^="/bulletins/"]')).toHaveCount(E2E_BULLETINS_COUNT)
})

test('shows edition and year subtitle', async ({ page }) => {
  await page.goto('/bulletins')

  await expect(page.getByText(`${NEWEST_EDITION}ª Edição — Ano II`)).toBeVisible()
})

test('clamps an out-of-range page instead of erroring', async ({ page }) => {
  const response = await page.goto('/bulletins?page=999')

  expect(response?.status()).toBe(200)
  await expect(page.getByRole('link', { name: /07 de junho de 2026/ })).toBeVisible()
})
