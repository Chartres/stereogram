// What a pattern needs for a stereogram to work, measured on the tile at the size the renderer
// uses it (fitted to one far-plane strip). The eyes fuse a stereogram by matching the same detail
// one strip apart; depth is read from how far apart the matches are. So, per pixel:
//
// 1. Texture everywhere: a flat patch has nothing to match, its depth is undefined, and the
//    figure turns into smears there (Pavol, 7 Nov: the embroidered sampler, mostly blank paper).
// 2. Luminance contrast: stereopsis runs mostly on brightness, so two colours of equal brightness
//    fuse poorly however different they look.
// 3. Detail across, not only along: only edges that cross a row (vertical or slanted) carry
//    disparity; a tile of horizontal stripes gives the eye nothing to measure.
// 4. No repeat inside the strip: a tile whose own pattern repeats every p pixels lets the eyes
//    lock onto the wrong copy, and the figure jumps to a false depth (the "wallpaper effect",
//    Brewster 1844). The renderer supplies the one repeat that is allowed: the strip itself.
//
// Pure: takes RGBA pixels, returns numbers and a verdict. Thresholds are set from the library
// (random dots and dense ornament pass, blank-paper samplers and stripes fail); see tileQuality.test.ts.

import type { Rgba } from './depth'
import { fitTile } from './pattern'

/** Tiles are judged at the default strip width (E 180, μ ⅓ → 90 px): the eye judges detail per strip, not per pixel. */
export const REFERENCE_WIDTH = 90

export interface TileQuality {
  /** share of pixels whose 7×7 neighbourhood is flat (luminance std < 0.045) */
  flat: number
  /** luminance standard deviation, 0–0.5 */
  contrast: number
  /** share of gradient energy across rows: mean|dL/dx| / (mean|dL/dx| + mean|dL/dy|) */
  across: number
  /** strongest circular autocorrelation of each row at lags 4…W/2 (1 = a perfect repeat) */
  repeat: number
  ok: boolean
  reasons: string[]
}

export const LIMITS = { flat: 0.12, contrast: 0.12, across: 0.3, repeat: 0.6 }

function luminance(t: Rgba): Float32Array {
  const L = new Float32Array(t.width * t.height)
  for (let i = 0; i < L.length; i++) L[i] = (0.2126 * t.data[i * 4] + 0.7152 * t.data[i * 4 + 1] + 0.0722 * t.data[i * 4 + 2]) / 255
  return L
}

export function tileQuality(tile: Rgba): TileQuality {
  const t = fitTile(tile, REFERENCE_WIDTH)
  const { width: W, height: H } = t
  const L = luminance(t)
  // contrast
  let mean = 0
  for (const v of L) mean += v
  mean /= L.length
  let varSum = 0
  for (const v of L) varSum += (v - mean) ** 2
  const contrast = Math.sqrt(varSum / L.length)
  // flat neighbourhoods (wrap around: the tile repeats both ways)
  const r = 3
  let flatCount = 0
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let s = 0
      let s2 = 0
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const v = L[((y + dy + H) % H) * W + ((x + dx + W) % W)]
          s += v
          s2 += v * v
        }
      const n = (2 * r + 1) ** 2
      if (Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2)) < 0.045) flatCount++
    }
  const flat = flatCount / L.length
  // gradient orientation
  let gx = 0
  let gy = 0
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = L[y * W + x]
      gx += Math.abs(L[y * W + ((x + 1) % W)] - v)
      gy += Math.abs(L[((y + 1) % H) * W + x] - v)
    }
  const across = gx + gy > 0 ? gx / (gx + gy) : 0
  // self-repeat along rows
  const maxLag = Math.floor(W / 2)
  const corr = new Float64Array(maxLag + 1)
  let energy = 0
  for (let y = 0; y < H; y++) {
    const row = L.subarray(y * W, (y + 1) * W)
    let m = 0
    for (const v of row) m += v
    m /= W
    for (let x = 0; x < W; x++) energy += (row[x] - m) ** 2
    for (let lag = 4; lag <= maxLag; lag++) {
      let c = 0
      for (let x = 0; x < W; x++) c += (row[x] - m) * (row[(x + lag) % W] - m)
      corr[lag] += c
    }
  }
  let repeat = 0
  if (energy > 0) for (let lag = 4; lag <= maxLag; lag++) repeat = Math.max(repeat, corr[lag] / energy)

  const reasons: string[] = []
  if (flat > LIMITS.flat) reasons.push(`${Math.round(flat * 100)} % of it is flat (blank paper, solid ground): nothing to match there`)
  if (contrast < LIMITS.contrast) reasons.push(`too little brightness contrast (${contrast.toFixed(2)}): colours of equal brightness fuse poorly`)
  if (across < LIMITS.across) reasons.push('its detail runs along the rows, not across them: no edges to measure depth from')
  if (repeat > LIMITS.repeat) reasons.push(`it repeats itself within the strip (${repeat.toFixed(2)}): the eyes lock onto the wrong copy`)
  return { flat, contrast, across, repeat, ok: reasons.length === 0, reasons }
}
