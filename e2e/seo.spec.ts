import { test, expect } from '@playwright/test'

// Discoverability kit (flywheel docs/standards/discoverability.md), asserted by content-type
// because an SPA fallback answers 200 text/html for every missing file.
const HOST = 'https://stereogram.dravec.org'

test('robots.txt welcomes everyone and names the sitemap', async ({ request }) => {
  const r = await request.get('/robots.txt')
  expect(r.ok()).toBe(true)
  expect(r.headers()['content-type']).toContain('text/plain')
  const body = await r.text()
  expect(body).toContain('Allow: /')
  expect(body).toContain('ClaudeBot')
  expect(body).toContain(`Sitemap: ${HOST}/sitemap.xml`)
})

test('sitemap.xml lists the canonical root', async ({ request }) => {
  const r = await request.get('/sitemap.xml')
  expect(r.ok()).toBe(true)
  expect(r.headers()['content-type']).toContain('xml')
  expect(await r.text()).toContain(`<loc>${HOST}/</loc>`)
})

test('llms.txt, security.txt, IndexNow key and og.png are served as themselves', async ({ request }) => {
  const llms = await request.get('/llms.txt')
  expect(llms.headers()['content-type']).toContain('text/plain')
  expect((await llms.text()).startsWith('# Stereogram')).toBe(true)
  const sec = await request.get('/.well-known/security.txt')
  expect(sec.headers()['content-type']).toContain('text/plain')
  expect(await sec.text()).toContain('Contact:')
  const key = await request.get('/9cc2dcb0952bc859471bd181b22e3dcb.txt')
  expect((await key.text()).trim()).toBe('9cc2dcb0952bc859471bd181b22e3dcb')
  // the card is a photograph-like picture, so a JPEG ≤ 300 KB (WhatsApp skips larger previews)
  const og = await request.get('/og.jpg')
  expect(og.headers()['content-type']).toContain('image/jpeg')
  const buf = await og.body()
  expect(buf.length).toBeLessThanOrEqual(300_000)
  const meta = await (await import('sharp')).default(buf).metadata()
  expect([meta.width, meta.height]).toEqual([1200, 630])
})

test('head carries canonical, OpenGraph card, twitter card and WebApplication JSON-LD', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Stereogram/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${HOST}/`)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${HOST}/og.jpg`)
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}')
  expect(ld['@type']).toBe('WebApplication')
  expect(ld.isAccessibleForFree).toBe(true)
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1)
  const icon = await page.locator('link[rel="icon"][type="image/svg+xml"]').getAttribute('href')
  expect(icon).toBe('/favicon.svg')
})

test('every book plate has its own page and link card: /plate/5/ carries its title, canonical and picture', async ({ page, request }) => {
  const html = await (await request.get('/plate/5/')).text()
  expect(html).toContain('<title>Plate 5: what is hidden here? · Stereogram</title>')
  expect(html).toContain(`property="og:image" content="${HOST}/og/plate-5.jpg"`)
  expect(html).toContain(`<link rel="canonical" href="${HOST}/plate/5/"`)
  const img = await request.get('/og/plate-5.jpg')
  expect(img.headers()['content-type']).toContain('image/jpeg')
  const buf = await img.body()
  expect(buf.length).toBeLessThanOrEqual(300_000)
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).toContain(`${HOST}/plate/100/`)
  // the page opens the app on that plate
  await page.goto('/plate/5/')
  await expect(page.getByRole('heading', { name: /Plate 5/ })).toBeVisible()
})
