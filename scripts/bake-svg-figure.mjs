#!/usr/bin/env node
// Bake a line drawing (SVG) into a depth figure: the drawing's light areas inside its outer
// circle become the raised path, dark lines the sunk walls, everything outside the far plane.
// Used for the Chartres labyrinth. Run: node scripts/bake-svg-figure.mjs <svg> <id> '<title>' '<credit>' <licence> <url>
import { chromium } from '@playwright/test'
import sharp from 'sharp'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const [svgPath, id, title, credit, licence, url] = process.argv.slice(2)
if (!url) {
  console.error('usage: bake-svg-figure.mjs <svg> <id> <title> <credit> <licence> <url>')
  process.exit(1)
}
const SIZE = 512
const svg = readFileSync(svgPath, 'utf8')

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const page = await browser.newPage()
await page.setViewportSize({ width: SIZE, height: SIZE })
await page.setContent(`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#fff}#c{width:${SIZE}px;height:${SIZE}px;display:grid;place-items:center}#c svg{width:${SIZE * 0.96}px;height:${SIZE * 0.96}px}</style><div id="c">${svg}</div>`)
const png = await page.locator('#c').screenshot({ omitBackground: false })
await browser.close()

const { data } = await sharp(png).greyscale().raw().toBuffer({ resolveWithObject: true })
// outer circle from the dark pixels' bounding box
let minX = SIZE, maxX = 0, minY = SIZE, maxY = 0
for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (data[y * SIZE + x] < 128) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y) }
const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, R = Math.max(maxX - minX, maxY - minY) / 2 + 1
const out = Buffer.alloc(SIZE * SIZE)
for (let y = 0; y < SIZE; y++)
  for (let x = 0; x < SIZE; x++) {
    const inside = (x - cx) ** 2 + (y - cy) ** 2 <= R * R
    const v = data[y * SIZE + x]
    out[y * SIZE + x] = !inside ? 0 : v < 128 ? 90 : 255 // walls sunk, path raised
  }
const file = `public/library/figures/${id}.png`
await sharp(out, { raw: { width: SIZE, height: SIZE, channels: 1 } }).png({ compressionLevel: 9 }).toFile(file)
const PROV = 'src/library/provenance.json'
const prov = existsSync(PROV) ? JSON.parse(readFileSync(PROV, 'utf8')) : { figures: [], patterns: [] }
prov.figures = prov.figures.filter((f) => f.id !== id)
prov.figures.push({ id, title, file: `/library/figures/${id}.png`, source: 'Wikimedia Commons', licence, url, credit })
prov.figures.sort((a, b) => a.title.localeCompare(b.title))
writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n')
console.log(`figure ${id}: circle at ${cx.toFixed(0)},${cy.toFixed(0)} r=${R.toFixed(0)}`)
