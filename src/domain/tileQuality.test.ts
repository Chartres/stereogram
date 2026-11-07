import { describe, expect, it } from 'vitest'
import { flatDepth } from './depth'
import { proceduralTile, TILES } from './pattern'
import { mulberry32 } from './prng'
import { renderStereogram } from './stereogram'
import { tileQuality } from './tileQuality'

const W = 90
const H = 90
function tile(px: (x: number, y: number) => [number, number, number]) {
  const data = new Uint8ClampedArray(W * H * 4)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const [r, g, b] = px(x, y)
      const o = (y * W + x) * 4
      data[o] = r
      data[o + 1] = g
      data[o + 2] = b
      data[o + 3] = 255
    }
  return { width: W, height: H, data }
}

describe('what a pattern needs', () => {
  it('random dots, the classic, pass every test', () => {
    const dots = renderStereogram(flatDepth(W, H), { eyeSeparation: 180, seed: 1, pattern: { kind: 'dots', density: 0.5 } })
    expect(tileQuality(dots).ok).toBe(true)
  })
  it('a single colour fails: nothing to match', () => {
    const q = tileQuality(tile(() => [200, 180, 150]))
    expect(q.ok).toBe(false)
    expect(q.flat).toBeGreaterThan(0.9)
  })
  it('a sampler on blank paper fails: dense ornament on a fifth of the tile, paper on the rest', () => {
    const rnd = mulberry32(3)
    const q = tileQuality(tile((x) => (x < 22 ? (rnd() < 0.5 ? [40, 40, 40] : [220, 210, 190]) : [244, 240, 230])))
    expect(q.reasons.join(' ')).toMatch(/flat/)
  })
  it('vertical stripes fail: they repeat inside the strip', () => {
    const q = tileQuality(tile((x) => (Math.floor(x / 6) % 2 ? [20, 20, 20] : [235, 235, 235])))
    expect(q.reasons.join(' ')).toMatch(/repeats itself/)
  })
  it('horizontal stripes fail: no edges across the rows to measure depth from', () => {
    const rnd = mulberry32(5)
    const rows = Array.from({ length: H }, () => (rnd() < 0.5 ? 20 : 235))
    const q = tileQuality(tile((_x, y) => [rows[y], rows[y], rows[y]]))
    expect(q.reasons.join(' ')).toMatch(/along the rows/)
  })
  it('two colours of equal brightness fail: red and green noise at the same luminance', () => {
    const rnd = mulberry32(9)
    const q = tileQuality(tile(() => (rnd() < 0.5 ? [255, 0, 0] : [0, 76, 0])))
    expect(q.reasons.join(' ')).toMatch(/brightness contrast/)
  })
})

describe('every procedural tile passes at every strip width the renderer uses', () => {
  for (const id of TILES)
    for (const size of [60, 90, 200, 300])
      it(`${id} at ${size} px`, () => {
        for (const seed of [1, 7, 1994]) {
          const q = tileQuality(proceduralTile(id, size, seed))
          expect(q.ok, `${id} ${size}px seed ${seed}: ${q.reasons.join('; ')}`).toBe(true)
        }
      })
})
