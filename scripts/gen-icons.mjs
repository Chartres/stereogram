// Rasterize the master public/favicon.svg into the PWA/apple icons (visuals.md "App icon").
// Run: node scripts/gen-icons.mjs
import { chromium } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'

const OUT = 'public/icons'
mkdirSync(OUT, { recursive: true })
const svg = readFileSync('public/favicon.svg', 'utf8')

function page(px, scale) {
  const m = px * scale
  const off = (px - m) / 2
  return `<!doctype html><meta charset="utf-8">
  <style>html,body{margin:0}#c{width:${px}px;height:${px}px;background:#f4f1ea;overflow:hidden}
  #c svg{position:absolute;left:${off}px;top:${off}px;width:${m}px;height:${m}px}</style>
  <div id="c">${svg}</div>`
}

const jobs = [
  { file: 'favicon-32.png', px: 32, scale: 1 },
  { file: 'icon-192.png', px: 192, scale: 1 },
  { file: 'icon-512.png', px: 512, scale: 1 },
  { file: 'maskable-512.png', px: 512, scale: 0.7 },
  { file: 'apple-touch-icon.png', px: 180, scale: 1 },
]

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const p = await browser.newPage()
for (const j of jobs) {
  await p.setViewportSize({ width: j.px, height: j.px })
  await p.setContent(page(j.px, j.scale))
  await p.locator('#c').screenshot({ path: `${OUT}/${j.file}`, omitBackground: false })
  console.log(`  ${OUT}/${j.file}`)
}
await browser.close()
