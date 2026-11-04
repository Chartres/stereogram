// Procedural pattern tiles for textured stereograms. Pure, seeded, no DOM.
import type { Rgba } from './depth'
import { mulberry32 } from './prng'

export const TILES = ['confetti', 'pebbles', 'weave', 'modrotlac'] as const
export type Tile = (typeof TILES)[number]

export const TILE_LABELS: Record<Tile, string> = {
  confetti: 'Confetti',
  pebbles: 'Pebbles',
  weave: 'Weave',
  modrotlac: 'Modrotlač (blueprint)',
}

const PALETTES: Record<Tile, [number, number, number][]> = {
  confetti: [
    [214, 48, 49],
    [253, 203, 110],
    [0, 148, 125],
    [9, 132, 227],
    [108, 92, 231],
    [255, 255, 255],
  ],
  pebbles: [
    [90, 74, 58],
    [151, 128, 104],
    [205, 190, 165],
    [234, 224, 206],
    [112, 110, 96],
  ],
  weave: [
    [26, 44, 70],
    [196, 160, 60],
    [160, 44, 48],
    [240, 234, 216],
  ],
  // blueprint resist printing (modrotlač): white reserve on indigo. Redrawn, not traced:
  // the ÚĽUV block photographs carry no licence. UNESCO 2018 (CZ/SK/AT/DE/HU).
  modrotlac: [
    [244, 241, 234],
    [27, 58, 107],
  ],
}

function fill(data: Uint8ClampedArray, i: number, c: [number, number, number]) {
  data[i] = c[0]
  data[i + 1] = c[1]
  data[i + 2] = c[2]
  data[i + 3] = 255
}

/** A square tile `size` px wide. Width is later fitted to the stereogram's strip width by `fitTile`. */
export function proceduralTile(tile: Tile, size: number, seed: number): Rgba {
  const data = new Uint8ClampedArray(size * size * 4)
  const rnd = mulberry32(seed)
  const pal = PALETTES[tile]
  const bg = pal[pal.length - 1]
  for (let i = 0; i < size * size; i++) fill(data, i * 4, bg)

  const circle = (cx: number, cy: number, r: number, c: [number, number, number]) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue
        // wrap so the tile repeats seamlessly
        const px = ((x % size) + size) % size
        const py = ((y % size) + size) % size
        fill(data, (py * size + px) * 4, c)
      }
  }

  if (tile === 'confetti') {
    const n = Math.round(size * size * 0.012)
    for (let k = 0; k < n; k++) circle(rnd() * size, rnd() * size, 1.5 + rnd() * size * 0.03, pal[Math.floor(rnd() * (pal.length - 1))])
  } else if (tile === 'pebbles') {
    const n = Math.round(size * size * 0.004)
    for (let k = 0; k < n; k++) circle(rnd() * size, rnd() * size, size * (0.03 + rnd() * 0.07), pal[Math.floor(rnd() * (pal.length - 1))])
  } else if (tile === 'modrotlac') {
    // a staggered grid of sprigs: a stem, two leaves, a berry; small dots between (the printers' "pepper")
    const cell = Math.max(12, Math.round(size / 6))
    const white = pal[0]
    const dot = (x: number, y: number) => circle(x, y, Math.max(1, size / 140), white)
    for (let gy = 0; gy < size; gy += cell)
      for (let gx = 0; gx < size; gx += cell) {
        const cx = gx + cell / 2 + ((gy / cell) % 2 ? cell / 2 : 0)
        const cy = gy + cell / 2
        for (let t = -cell * 0.3; t <= cell * 0.3; t += 1) dot(cx + t * 0.15, cy + t) // stem, slightly leaning
        circle(cx - cell * 0.18, cy - cell * 0.05, cell * 0.11, white)
        circle(cx + cell * 0.18, cy + 0.08 * cell, cell * 0.11, white)
        circle(cx + cell * 0.04, cy - cell * 0.32, cell * 0.07, white) // berry
        dot(gx + cell * 0.1, gy + cell * 0.1)
        dot(gx + cell * 0.9, gy + cell * 0.1)
      }
    const n = Math.round(size * size * 0.002)
    for (let k = 0; k < n; k++) dot(rnd() * size, rnd() * size)
  } else {
    // weave: alternating diagonal bands with speckle, so vertical repetition reads as cloth
    const band = Math.max(4, Math.round(size / 10))
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const k = Math.floor(((x + y) % size) / band) % (pal.length - 1)
        if ((x + y) % band < band / 2) fill(data, (y * size + x) * 4, pal[k])
      }
    const n = Math.round(size * size * 0.01)
    for (let k = 0; k < n; k++) circle(rnd() * size, rnd() * size, 1, pal[Math.floor(rnd() * (pal.length - 1))])
  }
  return { width: size, height: size, data }
}

/** Nearest-neighbour resize of a tile to `width` px wide (height keeps the aspect). */
export function fitTile(tile: Rgba, width: number): Rgba {
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round((tile.height * w) / tile.width))
  if (w === tile.width && h === tile.height) return tile
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    const sy = Math.min(tile.height - 1, Math.floor((y * tile.height) / h))
    for (let x = 0; x < w; x++) {
      const sx = Math.min(tile.width - 1, Math.floor((x * tile.width) / w))
      const s = (sy * tile.width + sx) * 4
      const d = (y * w + x) * 4
      data[d] = tile.data[s]
      data[d + 1] = tile.data[s + 1]
      data[d + 2] = tile.data[s + 2]
      data[d + 3] = tile.data[s + 3]
    }
  }
  return { width: w, height: h, data }
}
