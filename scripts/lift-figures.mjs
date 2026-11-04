#!/usr/bin/env node
// Lift every baked figure off the page: covered pixels are remapped so the figure's farthest
// point sits at FLOOR (not 40/255), which makes the silhouette a clear step in depth
// (Pavol, 4 Nov: "many of the pictures are hard to see, as if the depth wasn't contrasting
// enough"). Idempotent: already-lifted files map to themselves. Run: node scripts/lift-figures.mjs
import { readdirSync } from 'node:fs'
import sharp from 'sharp'

const DIR = 'public/library/figures'
const FLOOR = 120
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.png'))) {
  const p = `${DIR}/${f}`
  const { data, info } = await sharp(p).greyscale().raw().toBuffer({ resolveWithObject: true })
  let lo = 255, hi = 0
  for (let i = 0; i < data.length; i++) if (data[i] > 0) { lo = Math.min(lo, data[i]); hi = Math.max(hi, data[i]) }
  if (hi <= lo) continue
  const out = Buffer.alloc(data.length)
  for (let i = 0; i < data.length; i++) out[i] = data[i] === 0 ? 0 : Math.round(FLOOR + ((data[i] - lo) / (hi - lo)) * (255 - FLOOR))
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 1 } }).png({ compressionLevel: 9 }).toFile(p + '.tmp')
  await sharp(p + '.tmp').toFile(p)
  const { unlinkSync } = await import('node:fs')
  unlinkSync(p + '.tmp')
  console.log(`${f}: ${lo}–${hi} → ${FLOOR}–255`)
}
