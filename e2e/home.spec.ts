import { expect, test } from '@playwright/test'
import { FEATURED } from './seed-db'

test('features the latest article linking to its detail', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator(`a[href="/articles/${FEATURED.slug}"]`).first()).toBeVisible()
  const nav = page.getByRole('navigation', { name: 'Paginação' })
  await expect(nav.getByRole('link', { name: /próxima/i })).toBeVisible()
})

test('paginates the home article grid', async ({ page }) => {
  // 15 seeded articles, 12 per page -> the oldest (Artigo 14) lands on page 2.
  await page.goto('/?page=2')

  await expect(page.getByRole('link', { name: /Artigo 14/ })).toBeVisible()
})
