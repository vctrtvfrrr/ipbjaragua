import { expect, test } from '@playwright/test'
import { FEATURED } from './seed-db'

test('shows the article title, byline and rendered markdown', async ({ page }) => {
  await page.goto(`/articles/${FEATURED.slug}`)

  await expect(page.getByRole('heading', { level: 1, name: FEATURED.title })).toBeVisible()
  await expect(page.getByText('Rev. Jean Carlos Almeida — 07 de junho de 2026')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Subtítulo' })).toBeVisible()
  await expect(page.getByText('negrito')).toBeVisible()
})

test('returns 404 for an unknown slug', async ({ page }) => {
  const response = await page.goto('/articles/este-slug-nao-existe')

  expect(response?.status()).toBe(404)
})
