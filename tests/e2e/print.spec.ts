import { expect, test, type Page } from '@playwright/test'
import { E2E_LITURGY_ACTS } from './seed-db'

const LITURGY_PATH = '/liturgies/2026-06-07-0900-culto-solene'
const BULLETIN_PATH = '/bulletins/2026-06-07'

const A4_WIDTH_PT = 595
const A4_HEIGHT_PT = 842

function pdfPageSizes(pdf: Buffer): Array<{ width: number; height: number }> {
  return [...pdf.toString('latin1').matchAll(/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map((match) => ({
    width: Math.round(Number(match[1])),
    height: Math.round(Number(match[2])),
  }))
}

async function enterPrintMode(page: Page) {
  await page.emulateMedia({ media: 'print' })
  await page.waitForFunction(() => {
    window.dispatchEvent(new Event('beforeprint'))
    return [...document.querySelectorAll('details')].every((details) => details.open)
  })
}

test('prints the liturgy on A4 pages', async ({ page }) => {
  await page.goto(LITURGY_PATH)
  const sizes = pdfPageSizes(await page.pdf({ format: 'A4', printBackground: true }))

  expect(sizes.length).toBeGreaterThan(0)
  for (const size of sizes) {
    expect(size.width).toBeCloseTo(A4_WIDTH_PT, -1)
    expect(size.height).toBeCloseTo(A4_HEIGHT_PT, -1)
  }
})

test('uses three pages for a liturgy whose first reading crosses a page break (page-count proxy)', async ({ page }) => {
  await page.goto(LITURGY_PATH)

  const sizes = pdfPageSizes(await page.pdf({ format: 'A4', printBackground: true }))

  expect(sizes).toHaveLength(3)
})

test('brings collapsed acts onto the paper', async ({ page }) => {
  const [, collapsedAct] = E2E_LITURGY_ACTS
  await page.goto(LITURGY_PATH)

  await expect(page.getByText(collapsedAct.moment)).toBeHidden()

  await enterPrintMode(page)

  await expect(page.getByText(collapsedAct.moment)).toBeVisible()
})

test('drops the interface from the liturgy sheet', async ({ page }) => {
  await page.goto(LITURGY_PATH)
  await enterPrintMode(page)

  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeHidden()
  await expect(page.getByRole('contentinfo')).toBeHidden()
  await expect(page.getByRole('heading', { level: 1, name: 'Culto Solene' })).toBeVisible()
})

test('prints the bulletin on A4 with the article unclamped', async ({ page }) => {
  await page.goto(BULLETIN_PATH)
  const sizes = pdfPageSizes(await page.pdf({ format: 'A4', printBackground: true }))

  expect(sizes.length).toBeGreaterThan(0)
  for (const size of sizes) {
    expect(size.width).toBeCloseTo(A4_WIDTH_PT, -1)
    expect(size.height).toBeCloseTo(A4_HEIGHT_PT, -1)
  }

  await enterPrintMode(page)

  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeHidden()
  await expect(page.getByRole('contentinfo')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Continuar lendo' })).toBeHidden()
})
