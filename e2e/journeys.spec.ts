import { test, expect, type Page } from '@playwright/test'

// Persona journeys (docs/PERSONAS.md). Each writes a shot to e2e/shots/ (committed-shots contract).

async function rendered(page: Page) {
  // settle: not busy, and the render counter unchanged for 250 ms (debounce is 40 ms)
  const c = page.getByTestId('stereogram')
  await expect(c).toBeVisible()
  await expect.poll(async () => Number(await c.getAttribute('data-renders')), { timeout: 20_000 }).toBeGreaterThanOrEqual(1)
  await expect.poll(
    async () => {
      const a = await c.getAttribute('data-renders')
      await page.waitForTimeout(250)
      const b = await c.getAttribute('data-renders')
      return a === b && (await c.getAttribute('data-busy')) === '0'
    },
    { timeout: 30_000 },
  ).toBe(true)
}

/** Full-page shots repeat a fixed nav per viewport slice; park it in flow for the capture. */
async function shot(page: Page, name: string, full = false) {
  await page.evaluate(() => scrollTo(0, 0))
  if (!full) return page.screenshot({ path: `e2e/shots/${name}.png` })
  const tag = await page.addStyleTag({ content: 'nav[aria-label="Main"]{position:static}' })
  await page.screenshot({ path: `e2e/shots/${name}.png`, fullPage: true })
  await tag.evaluate((el) => (el as HTMLElement).remove())
}

function pngSize(buf: Buffer) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

test('P1 Marek: hides a word for a friend and copies the link', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await rendered(page)
  await page.getByRole('button', { name: 'Text', exact: true }).click()
  await page.getByLabel('Hidden text').fill('AHOJ')
  await rendered(page)
  await page.getByRole('button', { name: 'Copy link' }).click()
  const link = await page.evaluate(() => navigator.clipboard.readText())
  expect(link).toContain('text=AHOJ')
  expect(link).toContain('seed=')
  await expect(page.getByText('Link copied')).toBeVisible()
  await shot(page, 'persona-p1-text', true)
})

test('P2 Lenka: downloads an A4 print at 300 dpi', async ({ page }) => {
  await page.goto('/')
  await rendered(page)
  await page.getByRole('combobox', { name: 'Size' }).selectOption('a4')
  await rendered(page)
  await expect(page.getByText(/3508 × 2480 px, shown at/)).toBeVisible()
  const dl = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download PNG' }).click()
  const file = await dl
  expect(file.suggestedFilename()).toMatch(/^stereogram-sphere-\d+\.png$/)
  const buf = await (await import('node:fs/promises')).readFile(await file.path())
  expect(pngSize(buf)).toEqual({ width: 3508, height: 2480 })
  await shot(page, 'persona-p2-print')
})

test('P3 Tom: uploads his own depth map and inverts it', async ({ page }) => {
  await page.goto('/')
  await rendered(page)
  await page.getByRole('button', { name: 'Picture', exact: true }).click()
  // a depth map made on the fly: dark page, bright disc
  const dataUrl = await page.evaluate(() => {
    const c = document.createElement('canvas')
    c.width = 300
    c.height = 200
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, 300, 200)
    const g = ctx.createRadialGradient(150, 100, 0, 150, 100, 80)
    g.addColorStop(0, '#fff')
    g.addColorStop(1, '#000')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 300, 200)
    return c.toDataURL('image/png')
  })
  await page.getByTestId('depth-file').setInputFiles({ name: 'depth.png', mimeType: 'image/png', buffer: Buffer.from(dataUrl.split(',')[1], 'base64') })
  await rendered(page)
  await page.getByLabel('Show the depth map').check()
  await rendered(page)
  await shot(page, 'persona-p3-depth-reveal')
  // the revealed map carries the disc: a bright centre on a dark page
  const centre = await page.getByTestId('stereogram').evaluate((c: HTMLCanvasElement) => {
    const ctx = c.getContext('2d')!
    const mid = ctx.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data[0]
    const corner = ctx.getImageData(2, 2, 1, 1).data[0]
    return { mid, corner }
  })
  expect(centre.mid).toBeGreaterThan(200)
  expect(centre.corner).toBeLessThan(40)
  await page.getByLabel('Invert (black is near)').check()
  await rendered(page)
  const inverted = await page.getByTestId('stereogram').evaluate((c: HTMLCanvasElement) => c.getContext('2d')!.getImageData(2, 2, 1, 1).data[0])
  expect(inverted).toBeGreaterThan(200)
  await page.getByLabel('Show the depth map').uncheck()
  await rendered(page)
  await shot(page, 'persona-p3-upload', true)
})

test('P4 Eva on a phone: the picture leads, the action is under it, then she reads how to see it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await rendered(page)
  for (const w of [320, 375, 430]) {
    await page.setViewportSize({ width: w, height: 844 })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow, `x-overflow at ${w}`).toBe(false)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await rendered(page)
  const canvasBox = (await page.getByTestId('stereogram').boundingBox())!
  expect(canvasBox.y).toBeLessThanOrEqual(160)
  const btn = (await page.getByRole('button', { name: 'Download PNG' }).boundingBox())!
  expect(btn.y + btn.height).toBeLessThanOrEqual(844)
  expect(btn.height).toBeGreaterThanOrEqual(44)
  for (const tab of ['Make', 'How to see']) {
    const box = (await page.getByRole('link', { name: tab, exact: true }).boundingBox())!
    expect(box.height, `${tab} tab hit height`).toBeGreaterThanOrEqual(44)
  }
  await shot(page, 'persona-p4-phone-make')
  await page.getByRole('link', { name: 'How to see', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'How to see it' })).toBeVisible()
  await page.waitForTimeout(400) // let the view transition finish: a mid-animation shot is not evidence
  await expect(page.getByText(/one adult in fourteen/).first()).toBeVisible()
  await shot(page, 'persona-p4-phone-see', true)
})

test('P5 Jonas: the same link gives the same pixels; a new seed gives new ones', async ({ page }) => {
  const url = '/?shape=cone&seed=7&e=120&w=300&h=200&pattern=dots'
  const grab = async () => page.getByTestId('stereogram').evaluate((c: HTMLCanvasElement) => c.toDataURL())
  await page.goto(url)
  await rendered(page)
  const a = await grab()
  await page.goto(url)
  await rendered(page)
  expect(await grab()).toBe(a)
  await page.getByRole('button', { name: 'Shuffle' }).click()
  await rendered(page)
  expect(await grab()).not.toBe(a)
  expect(page.url()).toContain('shape=cone')
  await shot(page, 'persona-p5-seed')
})

test('P6 Klára: paints a relief with the brush', async ({ page }) => {
  await page.goto('/')
  await rendered(page)
  await page.getByRole('button', { name: 'Draw', exact: true }).click()
  const painter = page.getByTestId('painter')
  await expect(painter).toBeVisible()
  await painter.scrollIntoViewIfNeeded()
  const box = (await painter.boundingBox())!
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5, { steps: 12 })
  await page.mouse.up()
  await rendered(page)
  await page.getByLabel('Show the depth map').check()
  await rendered(page)
  const mid = await page.getByTestId('stereogram').evaluate((c: HTMLCanvasElement) => c.getContext('2d')!.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data[0])
  expect(mid).toBeGreaterThan(100)
  await shot(page, 'persona-p6-draw', true)
})

test('desktop: default page and every shape render', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await rendered(page)
  await shot(page, 'desktop-make', true)
  for (const shape of ['torus', 'pyramid', 'ripple', 'stairs', 'hills', 'heart']) {
    await page.getByRole('combobox', { name: 'Shape' }).selectOption(shape)
    await rendered(page)
  }
  await page.getByRole('combobox', { name: 'Pattern' }).selectOption('confetti')
  await rendered(page)
  await shot(page, 'desktop-heart-confetti')
})
