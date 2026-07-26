import { expect, test } from '@playwright/test'
import { E2E_ANNOUNCEMENT, E2E_ANNOUNCEMENT_WITHOUT_FLYER, FEATURED } from './seed-db'

test('features the latest article linking to its detail', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator(`a[href="/articles/${FEATURED.slug}"]`).first()).toBeVisible()
  await expect(page.getByRole('table').filter({ hasText: 'Inscrição' })).toBeVisible()
})

test('shows an announcement flyer linked to the full file', async ({ page }) => {
  await page.goto('/')

  const link = page.getByRole('link', { name: `Abrir Flyer Digital de ${E2E_ANNOUNCEMENT.title}` })
  await expect(link).toHaveAttribute('href', `/media/announcement-flyers/${E2E_ANNOUNCEMENT.flyer_path}`)
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link.locator('img')).toHaveAttribute('loading', 'lazy')
  const item = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: E2E_ANNOUNCEMENT.title }) })
  await expect(item.locator('svg')).toBeVisible()
  expect(
    await item.evaluate((element) => {
      const heading = element.querySelector('h3')!
      const flyer = element.querySelector('a[aria-label^="Abrir Flyer"]')!
      const description = element.querySelector('.prose')!
      return (
        Boolean(heading.compareDocumentPosition(flyer) & Node.DOCUMENT_POSITION_FOLLOWING) &&
        Boolean(flyer.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING)
      )
    })
  ).toBe(true)

  const itemWithoutFlyer = page
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name: E2E_ANNOUNCEMENT_WITHOUT_FLYER.title }) })
  await expect(itemWithoutFlyer.locator('img')).toHaveCount(0)
})

test('sends the reader to the full listing instead of paginating the home', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('navigation', { name: 'Paginação' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Ver todos os artigos' })).toHaveAttribute('href', '/articles')
})
