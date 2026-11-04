#!/usr/bin/env node
// Level every pattern tile in place: stretch the histogram and pull the mean luminance to ~0.5
// with a gamma, so a dark katagami photograph no longer makes a black stereogram (plate 4,
// 4 Nov 2026). Idempotent enough: a levelled tile levels to itself. Run: node scripts/level-tiles.mjs
import { readdirSync } from 'node:fs'
import sharp from 'sharp'

const DIR = 'public/library/patterns'
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.png'))) {
  const p = `${DIR}/${f}`
  const img = sharp(p).normalise()
  const { data, info } = await img.clone().greyscale().raw().toBuffer({ resolveWithObject: true })
  let sum = 0
  for (let i = 0; i < data.length; i++) sum += data[i]
  const mean = sum / data.length / 255
  const gamma = Math.min(3, Math.max(1 / 3, Math.log(0.5) / Math.log(Math.min(0.95, Math.max(0.05, mean)))))
  // sharp's gamma() brightens for values > 1 (it applies 1/gamma then gamma); emulate with a LUT instead
  const lut = Buffer.alloc(256)
  for (let v = 0; v < 256; v++) lut[v] = Math.round(255 * Math.pow(v / 255, 1 / gamma))
  const { data: rgb, info: ri } = await img.clone().removeAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < rgb.length; i++) rgb[i] = lut[rgb[i]]
  await sharp(rgb, { raw: { width: ri.width, height: ri.height, channels: 3 } }).png({ compressionLevel: 9, palette: true }).toFile(p + '.tmp')
  await sharp(p + '.tmp').toFile(p)
  const { unlinkSync } = await import('node:fs')
  unlinkSync(p + '.tmp')
  console.log(`${f}: mean ${mean.toFixed(2)} → gamma ${gamma.toFixed(2)} (${info.width}px)`)
}
