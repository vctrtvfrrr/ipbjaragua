import { expect, test } from '@playwright/test'
import { E2E_ARTICLES, FEATURED } from './seed-db'

test('lists every published article linking to its detail', async ({ page }) => {
  await page.goto('/articles')

  await expect(page.getByRole('link', { name: new RegExp(FEATURED.title) })).toBeVisible()
  await expect(page.locator('a[href^="/articles/"]')).toHaveCount(E2E_ARTICLES.length)
})

test('clamps an out-of-range page instead of erroring', async ({ page }) => {
  const response = await page.goto('/articles?page=999')

  expect(response?.status()).toBe(200)
  await expect(page.getByRole('link', { name: new RegExp(FEATURED.title) })).toBeVisible()
})
