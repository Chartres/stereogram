// Procedural pattern tiles for textured stereograms. Pure, seeded, no DOM. Every tile here must
// pass tileQuality (texture everywhere, brightness contrast, detail across the rows, no repeat
// inside the strip); pattern.test.ts checks all of them at the sizes the renderer uses.
import type { Rgba } from './depth'
import { mulberry32 } from './prng'

export const TILES = ['pen', 'truchet', 'confetti', 'pebbles', 'modrotlac'] as const
export type Tile = (typeof TILES)[number]

export const TILE_LABELS: Record<Tile, string> = {
  pen: 'Pen drawing',
  truchet: 'Hex Truchet',
  confetti: 'Confetti',
  pebbles: 'Pebbles',
  modrotlac: 'Modrotlač (blueprint)',
}

type RGB = [number, number, number]

const PAPER: RGB = [243, 238, 222]

function fill(data: Uint8ClampedArray, i: number, c: RGB) {
  data[i] = c[0]
  data[i + 1] = c[1]
  data[i + 2] = c[2]
  data[i + 3] = 255
}

/** Alpha-blend a colour into a pixel (ink on paper darkens where strokes cross, like a ballpoint). */
function blend(data: Uint8ClampedArray, i: number, c: RGB, a: number) {
  data[i] = data[i] + (c[0] - data[i]) * a
  data[i + 1] = data[i + 1] + (c[1] - data[i + 1]) * a
  data[i + 2] = data[i + 2] + (c[2] - data[i + 2]) * a
  data[i + 3] = 255
}

function canvas(width: number, height: number, bg: RGB) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) fill(data, i * 4, bg)
  // a soft disc, wrapped both ways so the tile repeats without a seam
  const disc = (cx: number, cy: number, r: number, c: RGB, a = 1) => {
    for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++)
      for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
        const cov = Math.min(1, Math.max(0, r + 0.5 - d))
        if (cov <= 0) continue
        const px = ((x % width) + width) % width
        const py = ((y % height) + height) % height
        blend(data, (py * width + px) * 4, c, cov * a)
      }
  }
  return { data, disc }
}

// ---- pen drawing (Pavol, 7 Nov: "I like a style like this, pen drawing"): ballpoint scribbles,
// each a stroke whose heading wanders smoothly; ink builds up where strokes cross.
function pen(size: number, seed: number): Rgba {
  const { data, disc } = canvas(size, size, PAPER)
  const rnd = mulberry32(seed)
  const ink: RGB = [36, 42, 140]
  const w = Math.max(0.5, size / 170) // pen radius, in proportion to the strip
  const strokes = 34 // per tile: the eye judges density per strip, so it does not grow with size
  for (let s = 0; s < strokes; s++) {
    let x = rnd() * size
    let y = rnd() * size
    let heading = rnd() * Math.PI * 2
    let turn = 0
    const length = size * (1.0 + rnd() * 1.2) // long, gently curving strokes, like a ballpoint hatching freely
    const pressure = 0.55 + rnd() * 0.4
    const stepPx = Math.max(0.4, size / 200)
    for (let t = 0; t < length; t += stepPx) {
      turn = turn * 0.97 + (rnd() - 0.5) * (0.018 * 90) / size // a slow wander, the same at every size
      heading += turn
      x += Math.cos(heading) * stepPx
      y += Math.sin(heading) * stepPx
      disc(x, y, w, ink, pressure)
    }
  }
  return { width: size, height: size, data }
}

// ---- hexagonal Truchet (from Pavol's Truchet Studio, 2026): flat-top hexes, the "C + X" matching
// [[0,1],[2,4],[3,5]] in one of six random orientations, strands as cubic curves that leave each
// edge perpendicular. 2 × 3 hexes per tile: the lattice then repeats exactly once per strip, the one
// repeat the renderer allows; 4 columns repeated inside the strip and the eyes locked onto the wrong
// copy (measured 0.66–0.74, limit 0.6). Each hex has its own ground tone, strands one of three inks,
// and the grounds are speckled so no patch is flat.
const CX: [number, number][] = [
  [0, 1],
  [2, 4],
  [3, 5],
]
function hexTruchet(width: number, seed: number, bands = 3): Rgba {
  const cols = 2
  const rows = 3
  const R = width / (1.5 * cols)
  const vStep = Math.sqrt(3) * R
  const height = Math.round(vStep * rows)
  const { data, disc } = canvas(width, height, PAPER)
  const rnd = mulberry32(seed)
  const tones: RGB[] = [
    [28, 26, 22],
    [96, 86, 72],
    [15, 90, 99],
  ]
  const weight = Math.max(0.7, width / 70)
  const rot: number[] = []
  for (let i = 0; i < cols * rows; i++) rot.push(Math.floor(rnd() * 6))
  // each hexagon gets its own ground tone (the studio's Fill mode): a lattice of identical cells
  // repeats inside the strip, a lattice of differently toned cells does not
  const grounds: RGB[] = [PAPER, [226, 205, 160], [178, 204, 196], [208, 196, 214], [160, 150, 132]]
  const ground: RGB[] = []
  for (let i = 0; i < cols * rows; i++) ground.push(grounds[Math.floor(rnd() * grounds.length)])
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      // nearest hex centre (flat-top, odd columns shifted down by half a row), wrapped
      let best = 0
      let bd = Infinity
      for (let col = -1; col <= cols; col++) {
        const cx = R + col * 1.5 * R
        if (Math.abs(cx - x) > 2 * R) continue
        for (let row = -1; row <= rows; row++) {
          const cy = (col & 1 ? vStep / 2 : 0) + row * vStep + vStep / 2
          const d = (cx - x) ** 2 + (cy - y) ** 2
          if (d < bd) {
            bd = d
            best = (((row % rows) + rows) % rows) * cols + (((col % cols) + cols) % cols)
          }
        }
      }
      fill(data, (y * width + x) * 4, ground[best])
    }
  // speckle on the grounds: a count per tile, so the texture is the same at every strip width
  for (let k = 0; k < 700; k++) disc(rnd() * width, rnd() * height, Math.max(0.5, width / 150), rnd() < 0.5 ? [96, 86, 72] : [250, 246, 236], 0.85)
  const vtx = (cx: number, cy: number, j: number): [number, number] => [cx + R * Math.cos((Math.PI / 3) * j), cy + R * Math.sin((Math.PI / 3) * j)]
  const lerp = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  const inNorm = (cx: number, cy: number, e: number): [number, number] => {
    const va = vtx(cx, cy, e)
    const vb = vtx(cx, cy, (e + 1) % 6)
    let nx = -(vb[1] - va[1])
    let ny = vb[0] - va[0]
    const l = Math.hypot(nx, ny) || 1
    nx /= l
    ny /= l
    const mx = (va[0] + vb[0]) / 2
    const my = (va[1] + vb[1]) / 2
    if (nx * (cx - mx) + ny * (cy - my) < 0) {
      nx = -nx
      ny = -ny
    }
    return [nx, ny]
  }
  const toneOf: RGB[] = []
  for (let i = 0; i < cols * rows * 3 * bands; i++) toneOf.push(tones[Math.floor(rnd() * tones.length)])
  for (let col = -1; col <= cols; col++)
    for (let row = -1; row <= rows; row++) {
      const cx = R + col * 1.5 * R
      const cy = (col & 1 ? vStep / 2 : 0) + row * vStep + vStep / 2
      const cell = (((row % rows) + rows) % rows) * cols + (((col % cols) + cols) % cols)
      const r = rot[cell]
      CX.forEach(([a0, b0], ci) => {
        const a = (a0 + r) % 6
        const b = (b0 + r) % 6
        for (let k = 1; k <= bands; k++) {
          const f = (2 * k - 1) / (2 * bands)
          const adj = (a - b + 6) % 6 === 1 || (b - a + 6) % 6 === 1
          let pa: [number, number]
          let pb: [number, number]
          if (adj) {
            const sv = (b - a + 6) % 6 === 1 ? b : a
            pa = lerp(vtx(cx, cy, sv), vtx(cx, cy, (sv + 5) % 6), f)
            pb = lerp(vtx(cx, cy, sv), vtx(cx, cy, (sv + 1) % 6), f)
          } else {
            pa = lerp(vtx(cx, cy, a), vtx(cx, cy, (a + 1) % 6), f)
            pb = lerp(vtx(cx, cy, b), vtx(cx, cy, (b + 1) % 6), f)
          }
          const na = inNorm(cx, cy, a)
          const nb = inNorm(cx, cy, b)
          const L = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) || 1e-6
          const h = L * 0.55
          const c1: [number, number] = [pa[0] + na[0] * h, pa[1] + na[1] * h]
          const c2: [number, number] = [pb[0] + nb[0] * h, pb[1] + nb[1] * h]
          const tone = toneOf[(cell * 3 + ci) * bands + k - 1]
          const SEG = Math.max(16, Math.round(L * 2))
          for (let i = 0; i <= SEG; i++) {
            const t = i / SEG
            const u = 1 - t
            const x = u * u * u * pa[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * pb[0]
            const y = u * u * u * pa[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * pb[1]
            disc(x, y, weight / 2, tone)
          }
        }
      })
    }
  return { width, height, data }
}

/** A tile `size` px wide, drawn at the size it will be used (the far-plane strip width), so lines stay crisp. */
export function proceduralTile(tile: Tile, size: number, seed: number): Rgba {
  const s = Math.max(24, Math.round(size))
  if (tile === 'pen') return pen(s, seed)
  if (tile === 'truchet') return hexTruchet(s, seed)
  const rnd = mulberry32(seed)
  if (tile === 'confetti') {
    const pal: RGB[] = [
      [214, 48, 49],
      [222, 160, 40],
      [0, 128, 110],
      [9, 112, 200],
      [108, 92, 231],
      [40, 36, 30],
    ]
    const { data, disc } = canvas(s, s, [250, 248, 242])
    for (let k = 0; k < 260; k++) disc(rnd() * s, rnd() * s, s * (0.01 + rnd() * 0.028), pal[Math.floor(rnd() * pal.length)])
    return { width: s, height: s, data }
  }
  if (tile === 'pebbles') {
    // pebbles of many sizes, each speckled, packed so no bare ground is left between them
    const pal: RGB[] = [
      [70, 56, 42],
      [151, 128, 104],
      [222, 210, 186],
      [112, 110, 96],
      [44, 38, 32],
      [190, 172, 140],
    ]
    const { data, disc } = canvas(s, s, [168, 156, 136])
    for (let k = 0; k < 150; k++) disc(rnd() * s, rnd() * s, s * (0.012 + rnd() * 0.04), pal[Math.floor(rnd() * pal.length)])
    for (let k = 0; k < 500; k++) disc(rnd() * s, rnd() * s, Math.max(0.5, s / 180), rnd() < 0.5 ? [36, 30, 24] : [240, 232, 218], 0.85)
    return { width: s, height: s, data }
  }
  // modrotlač (blueprint resist printing): white reserve on indigo, redrawn (ÚĽUV block photographs
  // carry no licence). Sprigs are scattered, turned and sized at random, with the printers' "pepper"
  // between them: a regular grid of sprigs repeated inside the strip (measured 0.73, limit 0.6).
  const indigo: RGB = [27, 58, 107]
  const white: RGB = [244, 241, 234]
  const { data, disc } = canvas(s, s, indigo)
  const sprigs = 42
  for (let k = 0; k < sprigs; k++) {
    const cx = rnd() * s
    const cy = rnd() * s
    const len = s * (0.04 + rnd() * 0.05)
    const ang = rnd() * Math.PI * 2
    const dx = Math.cos(ang)
    const dy = Math.sin(ang)
    for (let t = -len; t <= len; t += 0.5) disc(cx + dx * t, cy + dy * t, Math.max(0.5, s / 200), white) // stem
    const leaf = len * (0.35 + rnd() * 0.25)
    disc(cx - dy * leaf * 0.8 + dx * len * 0.2, cy + dx * leaf * 0.8 + dy * len * 0.2, leaf * 0.55, white)
    disc(cx + dy * leaf * 0.8 - dx * len * 0.1, cy - dx * leaf * 0.8 - dy * len * 0.1, leaf * 0.55, white)
    disc(cx + dx * len * 1.15, cy + dy * len * 1.15, leaf * 0.4, white) // berry
  }
  for (let k = 0; k < 420; k++) disc(rnd() * s, rnd() * s, Math.max(0.5, s / 170), white) // pepper
  return { width: s, height: s, data }
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
