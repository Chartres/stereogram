import { test, expect, type Page } from '@playwright/test'

// The three signature moves (docs/SIGNATURE.md, approved 2026-11-04): the library with
// provenance, the book of plates, the patient eye.

async function settled(page: Page, testId = 'stereogram') {
  const c = page.getByTestId(testId)
  await expect(c).toBeVisible()
  await expect.poll(async () => Number(await c.getAttribute('data-renders')), { timeout: 30_000 }).toBeGreaterThanOrEqual(1)
  await expect.poll(
    async () => {
      const a = await c.getAttribute('data-renders')
      await page.waitForTimeout(250)
      return a === (await c.getAttribute('data-renders')) && (await c.getAttribute('data-busy')) === '0'
    },
    { timeout: 30_000 },
  ).toBe(true)
}

async function shot(page: Page, name: string, full = false) {
  await page.evaluate(() => scrollTo(0, 0))
  if (!full) return page.screenshot({ path: `e2e/shots/${name}.png` })
  const tag = await page.addStyleTag({ content: 'nav[aria-label="Main"]{position:static}' })
  await page.screenshot({ path: `e2e/shots/${name}.png`, fullPage: true })
  await tag.evaluate((el) => (el as HTMLElement).remove())
}

test('P7 Hana: hides a museum sculpture in Met ornament and the credit prints under it', async ({ page }) => {
  await page.goto('/')
  await settled(page)
  await page.getByRole('button', { name: 'Figure', exact: true }).click()
  await settled(page)
  const fig = page.getByRole('combobox', { name: /Figure/ })
  await fig.selectOption({ index: 2 })
  await settled(page)
  const pattern = page.getByRole('combobox', { name: 'Pattern' })
  const lib = await pattern.locator('option[value^="lib:"]').first().getAttribute('value')
  await pattern.selectOption(lib!)
  await settled(page)
  const credit = page.getByTestId('provenance')
  await expect(credit).toContainText('Poly Haven, CC0')
  await expect(credit).toContainText('The Met, CC0')
  expect(page.url()).toContain('figure=')
  expect(page.url()).toContain('pattern=lib%3A')
  // the figure really is in the picture: reveal shows a bright centre on a dark page
  await page.getByLabel('Show the depth map').check()
  await settled(page)
  const mid = await page.getByTestId('stereogram').evaluate((c: HTMLCanvasElement) => {
    const ctx = c.getContext('2d')!
    let max = 0
    for (let x = 0; x < c.width; x += 8) max = Math.max(max, ctx.getImageData(x, Math.floor(c.height / 2), 1, 1).data[0])
    return max
  })
  expect(mid).toBeGreaterThan(150)
  await page.getByLabel('Show the depth map').uncheck()
  await settled(page)
  await shot(page, 'persona-p7-figure-ornament', true)
})

test('P8 Ondřej: opens the book, reads a plate, shows the answer, turns the page, makes his own', async ({ page }) => {
  await page.goto('/#/book/1')
  await settled(page)
  await expect(page.getByRole('heading', { name: /Plate 1/ })).toBeVisible()
  await expect(page.getByText(/Find the angle/)).toBeVisible()
  await expect(page.getByText(/Figure ·/)).toBeVisible()
  await expect(page.getByText(/The Met, CC0/)).toBeVisible()
  await shot(page, 'persona-p8-book-plate')
  await page.getByRole('button', { name: 'Show the answer' }).click()
  await settled(page)
  await expect(page.getByText(/The answer:/)).toBeVisible()
  await shot(page, 'persona-p8-book-answer')
  await page.getByRole('link', { name: 'Next plate' }).click()
  await expect(page.getByRole('heading', { name: /Plate 2/ })).toBeVisible()
  await settled(page)
  const href = await page.getByRole('link', { name: 'Make your own' }).getAttribute('href')
  expect(href).toMatch(/figure=.*pattern=lib%3A/)
  await page.goto(href!)
  await settled(page)
  await expect(page.getByTestId('provenance')).toContainText('CC0')
})

test('P9 Eva again: climbs the patient eye, rung by rung, and the progress survives a reload', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/see')
  await expect(page.getByRole('heading', { name: /The patient eye/ })).toBeVisible()
  await expect(page.getByTestId('rung-1')).toHaveAttribute('data-state', 'open')
  await expect(page.getByTestId('rung-2')).toHaveAttribute('data-state', 'locked')
  await settled(page, 'ladder-1')
  await page.getByTestId('rung-1').scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'e2e/shots/persona-p9-ladder-rung1.png' })
  await page.getByRole('button', { name: 'I saw it' }).click()
  await expect(page.getByTestId('rung-1')).toHaveAttribute('data-state', 'seen')
  await expect(page.getByTestId('rung-2')).toHaveAttribute('data-state', 'open')
  await settled(page, 'ladder-2')
  await page.reload()
  await expect(page.getByTestId('rung-1')).toHaveAttribute('data-state', 'seen')
  await expect(page.getByTestId('rung-2')).toHaveAttribute('data-state', 'open')
  // shimmer re-renders on its own
  await page.getByLabel(/Shimmer the dots/).check()
  const before = Number(await page.getByTestId('ladder-2').getAttribute('data-renders'))
  await page.waitForTimeout(700)
  expect(Number(await page.getByTestId('ladder-2').getAttribute('data-renders'))).toBeGreaterThan(before)
  await page.getByLabel(/Shimmer the dots/).uncheck()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
  for (const tab of ['Make', 'Book', 'How to see']) {
    const box = (await page.getByRole('link', { name: tab, exact: true }).boundingBox())!
    expect(box.height, `${tab} tab`).toBeGreaterThanOrEqual(44)
  }
})
