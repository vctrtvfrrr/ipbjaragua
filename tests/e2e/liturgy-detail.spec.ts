import { expect, test, type Page } from '@playwright/test'
import { E2E_LITURGY_ACTS, E2E_SONG } from './seed-db'

const LITURGY_PATH = '/liturgies/2026-06-07-0900-culto-solene'

function actDetails(page: Page, name: string) {
  return page.getByRole('heading', { name, exact: true }).locator('..').locator('..')
}

// The Atos work as plain markup until KeepOneLiturgyActOpen attaches, and a click that
// lands before that closes an open Ato for good. Only the enhanced behaviour is worth
// asserting, so wait for the list to say it is live.
async function actEnhancement(page: Page) {
  await expect(page.locator('#liturgy-acts')).toHaveAttribute('data-keep-one-act-open', 'on')
}

test('opening an act closes the previously open act', async ({ page }) => {
  const [firstAct, secondAct] = E2E_LITURGY_ACTS
  await page.goto(LITURGY_PATH)

  const secondHeading = page.getByRole('heading', { name: secondAct.name, exact: true })
  const firstDetails = actDetails(page, firstAct.name)
  const secondDetails = actDetails(page, secondAct.name)

  await actEnhancement(page)

  await expect(firstDetails).toHaveAttribute('open', '')
  await expect(secondDetails).not.toHaveAttribute('open', '')

  await secondHeading.click()

  await expect(firstDetails).not.toHaveAttribute('open', '')
  await expect(secondDetails).toHaveAttribute('open', '')
})

test('an open act cannot be closed with mouse or keyboard', async ({ page }) => {
  const [firstAct] = E2E_LITURGY_ACTS
  await page.goto(LITURGY_PATH)

  const heading = page.getByRole('heading', { name: firstAct.name, exact: true })
  const summary = heading.locator('..')
  const details = actDetails(page, firstAct.name)

  await actEnhancement(page)

  await heading.click()
  await expect(details).toHaveAttribute('open', '')

  await summary.focus()
  await summary.press('Enter')
  await expect(details).toHaveAttribute('open', '')
})

// The regression guard for the gate above: with hydration held back, an ungated click
// closes the Ato natively and no timeout ever brings it back.
test('keeps an open act open when hydration arrives late', async ({ page }) => {
  const [firstAct] = E2E_LITURGY_ACTS

  await page.route('**/*.js*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    await route.continue()
  })

  await page.goto(LITURGY_PATH, { waitUntil: 'commit' })

  const heading = page.getByRole('heading', { name: firstAct.name, exact: true })
  const details = actDetails(page, firstAct.name)

  await actEnhancement(page)

  await heading.click()
  await expect(details).toHaveAttribute('open', '')
})

test('frames each song with a heading and its own panel', async ({ page }) => {
  await page.goto(LITURGY_PATH)

  const label = page.getByText('Cântico', { exact: true })
  const panel = label.locator('+ div')

  await expect(label).toBeVisible()
  await expect(panel.getByRole('heading', { name: E2E_SONG.title })).toBeVisible()
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('keeps native acts independently accessible', async ({ page }) => {
    const [firstAct, secondAct] = E2E_LITURGY_ACTS
    await page.goto(LITURGY_PATH)

    const firstDetails = actDetails(page, firstAct.name)
    const secondHeading = page.getByRole('heading', { name: secondAct.name, exact: true })
    const secondDetails = actDetails(page, secondAct.name)

    await secondHeading.click()

    await expect(firstDetails).toHaveAttribute('open', '')
    await expect(secondDetails).toHaveAttribute('open', '')
    await expect(page.getByText(secondAct.moment)).toBeVisible()
  })
})
