import { expect, test } from '@playwright/test'
import { FEATURED } from './seed-db'

test('features the latest article linking to its detail', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator(`a[href="/articles/${FEATURED.slug}"]`).first()).toBeVisible()
  await expect(page.getByRole('table').filter({ hasText: 'Inscrição' })).toBeVisible()
})

test('sends the reader to the full listing instead of paginating the home', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('navigation', { name: 'Paginação' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Ver todos os artigos' })).toHaveAttribute('href', '/articles')
})
