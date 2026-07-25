import { expect, test, type Page } from '@playwright/test'
import { E2E_LITURGY_ACTS } from './seed-db'

const LITURGY_PATH = '/liturgies/2026-06-07-0900-culto-solene'

function actDetails(page: Page, name: string) {
  return page.getByRole('heading', { name, exact: true }).locator('..').locator('..')
}

test('opening an act closes the previously open act', async ({ page }) => {
  const [firstAct, secondAct] = E2E_LITURGY_ACTS
  await page.goto(LITURGY_PATH)

  const secondHeading = page.getByRole('heading', { name: secondAct.name, exact: true })
  const firstDetails = actDetails(page, firstAct.name)
  const secondDetails = actDetails(page, secondAct.name)

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

  await heading.click()
  await expect(details).toHaveAttribute('open', '')

  await summary.focus()
  await summary.press('Enter')
  await expect(details).toHaveAttribute('open', '')
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
