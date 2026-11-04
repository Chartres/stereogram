#!/usr/bin/env node
// Make every pattern tile repeat without a visible seam: the renderer refits a tile to the strip
// width and repeats it across and down, so a photographed ornament shows its crop edges as
// "gaps between rows" (Pavol, 4 Nov). Fix in place: cross-fade the left/right edges over 12 %
// and mirror the bottom half so the vertical repeat is continuous. Idempotent enough.
// Run: node scripts/seam-tiles.mjs [file...]
import { readdirSync } from 'node:fs'
import sharp from 'sharp'

const DIR = 'public/library/patterns'
const files = process.argv.length > 2 ? process.argv.slice(2) : readdirSync(DIR).filter((x) => x.endsWith('.png')).map((f) => `${DIR}/${f}`)
for (const p of files) {
  const { data, info } = await sharp(p).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  const fade = Math.round(W * 0.12)
  const out = Buffer.from(data)
  // horizontal: blend the first `fade` columns with the wrapped-around last columns
  for (let y = 0; y < H; y++)
    for (let x = 0; x < fade; x++) {
      const t = x / fade
      for (let c = 0; c < 3; c++) {
        const a = data[(y * W + x) * 3 + c]
        const b = data[(y * W + (W - fade + x)) * 3 + c]
        out[(y * W + x) * 3 + c] = Math.round(a * t + b * (1 - t))
      }
    }
  // vertical: mirror the top half into the bottom half, so row H-1 equals row 0
  const half = Math.floor(H / 2)
  for (let y = half; y < H; y++) {
    const src = H - 1 - y
    out.copyWithin(y * W * 3, src * W * 3, (src + 1) * W * 3)
  }
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 9, palette: true }).toFile(p + '.tmp')
  await sharp(p + '.tmp').toFile(p)
  const { unlinkSync } = await import('node:fs')
  unlinkSync(p + '.tmp')
  console.log(`${p.split('/').pop()}: seamed`)
}
