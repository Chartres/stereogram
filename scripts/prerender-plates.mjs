#!/usr/bin/env node
// After `vite build`: one page per book plate (dist/plate/<n>/index.html, its own link card) and
// one card image per plate (dist/og/plate-<n>.jpg, the plate itself, 1200×630, ≤ 300 KB so
// WhatsApp shows it). Also dist/og/hero.jpg, the picture behind the site's own og.png, and a
// sitemap that lists every plate. Runs the app's own renderer through Vite's SSR loader, so a
// card is the same pixels the page draws. Run: node scripts/prerender-plates.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const W = 1200
const H = 630
const MAX_BYTES = 300_000

const server = await createServer({
  root: ROOT,
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true, include: [] },
  resolve: { alias: { '@': path.join(ROOT, 'src') } },
})
try {
  const load = (p) => server.ssrLoadModule(p)
  const { plates, plateParams } = await load('/src/book/plates.ts')
  const { plateHtml, platePath, plateImage, HOST } = await load('/src/book/plateMeta.ts')
  const { renderStereogram, helperDots } = await load('/src/domain/stereogram.ts')
  const { depthFromRgba, fitDepth } = await load('/src/domain/depth.ts')
  const { figureById, patternById } = await load('/src/library/index.ts')

  const rgba = async (file) => {
    const { data, info } = await sharp(path.join(ROOT, 'public', file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    return { width: info.width, height: info.height, data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length) }
  }

  /** Render a plate spec to a JPEG under the size cap, helper dots drawn as on the page. */
  async function card(figureId, patternId, seed, depth, E = 180) {
    const fig = figureById(figureId)
    const pat = patternById(patternId)
    const d = fitDepth(depthFromRgba(await rgba(fig.file)), W, H)
    const img = renderStereogram(d, { eyeSeparation: E, depthOfField: depth, seed, pattern: { kind: 'tile', tile: await rgba(pat.file) } })
    const { left, right } = helperDots(W, E, depth)
    const r = 11
    for (const cx of [left, right])
      for (let y = 34 - r - 3; y <= 34 + r + 3; y++)
        for (let x = cx - r - 3; x <= cx + r + 3; x++) {
          const d2 = (x - cx) ** 2 + (y - 34) ** 2
          if (d2 > (r + 3) ** 2) continue
          const o = (y * W + x) * 4
          const [cr, cg, cb] = d2 <= r * r ? [15, 90, 99] : [244, 241, 234]
          img.data[o] = cr
          img.data[o + 1] = cg
          img.data[o + 2] = cb
        }
    for (const q of [80, 72, 64, 56]) {
      const buf = await sharp(Buffer.from(img.data.buffer), { raw: { width: W, height: H, channels: 4 } }).removeAlpha().jpeg({ quality: q, mozjpeg: true }).toBuffer()
      if (buf.length <= MAX_BYTES || q === 56) return buf
    }
  }

  mkdirSync(path.join(DIST, 'og'), { recursive: true })
  const template = readFileSync(path.join(DIST, 'index.html'), 'utf8')
  const list = plates()
  let biggest = 0
  if (process.env.HERO_TRY) {
    // try hero tiles: HERO_TRY=id,id,... writes dist/og/hero-<id>.jpg and stops
    for (const id of process.env.HERO_TRY.split(',')) writeFileSync(path.join(DIST, 'og', `hero-${id}.jpg`), await card('smk_discobolus', id, 1994, 1 / 3, 240))
    process.exit(0)
  }
  for (const p of list) {
    const jpg = await card(p.figure, p.pattern, p.seed, p.depth)
    biggest = Math.max(biggest, jpg.length)
    writeFileSync(path.join(DIST, plateImage(p.n).slice(1)), jpg)
    const dir = path.join(DIST, platePath(p.n).slice(1))
    mkdirSync(dir, { recursive: true })
    writeFileSync(path.join(dir, 'index.html'), plateHtml(template, p.n))
  }
  // the picture behind the site card: Discobolus in an Iznik tile panel, wide strips so the
  // ornament reads at thumbnail size (Morris's Marigold read as grain, 5 Nov)
  const heroFig = figureById('smk_discobolus') ? 'smk_discobolus' : list[0].figure
  const heroPat = patternById('iznik-447013') ? 'iznik-447013' : list[0].pattern
  writeFileSync(path.join(DIST, 'og', 'hero.jpg'), await card(heroFig, heroPat, 1994, 1 / 3, 240))

  const today = new Date().toISOString().slice(0, 10)
  const urls = [`${HOST}/`, ...list.map((p) => `${HOST}${platePath(p.n)}`)]
  writeFileSync(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`,
  )
  console.log(`plates: ${list.length} pages + cards, largest card ${(biggest / 1024).toFixed(0)} KB; sitemap ${urls.length} urls`)
  if (biggest > MAX_BYTES) console.warn(`warning: a card is over ${MAX_BYTES / 1000} KB; WhatsApp may skip it`)
} finally {
  await server.close()
}
