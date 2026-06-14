import { expect, test } from '@playwright/test'
import { E2E_ANNOUNCEMENT, E2E_LITURGY, E2E_MEMBER, FEATURED } from './seed-db'

const BULLETIN_DATE = '2026-06-07'
const BULLETIN_FLAGS_OFF = '2026-05-31'

test('shows bulletin header with edition and year', async ({ page }) => {
  await page.goto(`/bulletins/${BULLETIN_DATE}`)

  await expect(page.getByRole('heading', { name: /07 de junho de 2026/ })).toBeVisible()
  await expect(page.getByText('70ª Edição — Ano II')).toBeVisible()
})

test('shows article section with title and expand control', async ({ page }) => {
  await page.goto(`/bulletins/${BULLETIN_DATE}`)

  await expect(page.getByText(FEATURED.title)).toBeVisible()
  await expect(page.getByText(FEATURED.author)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continuar lendo' })).toBeVisible()
})

test('shows liturgy link pointing to correct slug', async ({ page }) => {
  await page.goto(`/bulletins/${BULLETIN_DATE}`)

  await expect(page.getByRole('link', { name: E2E_LITURGY.theme })).toHaveAttribute(
    'href',
    `/liturgies/${BULLETIN_DATE}-culto-solene`
  )
})

test('returns 404 for unknown date', async ({ page }) => {
  const response = await page.goto('/bulletins/1900-01-01')

  expect(response?.status()).toBe(404)
})

test('shows agenda, announcements and birthdays sections when flags are on', async ({ page }) => {
  await page.goto(`/bulletins/${BULLETIN_DATE}`)

  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible()
  await expect(page.getByText('Culto Dominical')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Anúncios' })).toBeVisible()
  await expect(page.getByText(E2E_ANNOUNCEMENT.title)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Aniversariantes' })).toBeVisible()
  await expect(page.getByText(new RegExp(E2E_MEMBER.full_name))).toBeVisible()
})

test('omits sections when flags are off', async ({ page }) => {
  await page.goto(`/bulletins/${BULLETIN_FLAGS_OFF}`)

  await expect(page.getByRole('heading', { name: 'Agenda' })).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Anúncios' })).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Aniversariantes' })).not.toBeVisible()
})
