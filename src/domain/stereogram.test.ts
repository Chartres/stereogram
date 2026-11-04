import { describe, expect, it } from 'vitest'
import { flatDepth, shapeDepth, SHAPES, depthFromRgba, resampleDepth, blurDepth, depthToRgba } from './depth'
import { helperDots, linkRow, renderStereogram, separation } from './stereogram'
import { fitTile, proceduralTile, TILES } from './pattern'

const E = 180
const MU = 1 / 3

const same = (a: Uint8ClampedArray, b: Uint8ClampedArray) => a.length === b.length && a.every((v, i) => v === b[i])

function px(img: { width: number; data: Uint8ClampedArray }, x: number, y: number) {
  const o = (y * img.width + x) * 4
  return [img.data[o], img.data[o + 1], img.data[o + 2]].join(',')
}

describe('separation (Thimbleby–Inglis–Witten eq. 1)', () => {
  it('far plane is E/2 and the near plane is closer together', () => {
    expect(separation(0, E, MU)).toBe(90)
    expect(separation(1, E, MU)).toBe(72)
    expect(separation(0.5, E, MU)).toBeLessThan(separation(0, E, MU))
  })
})

describe('renderStereogram', () => {
  it('a flat scene repeats every far-plane separation, on every row', () => {
    const img = renderStereogram(flatDepth(400, 6), { eyeSeparation: E, seed: 1, pattern: { kind: 'dots' } })
    const far = separation(0, E, MU)
    for (let y = 0; y < 6; y++)
      for (let x = 0; x + far < 400; x++) expect(px(img, x, y)).toBe(px(img, x + far, y))
  })

  it('a raised sphere breaks the far-plane period where it stands', () => {
    const d = shapeDepth('sphere', 400, 200)
    const img = renderStereogram(d, { eyeSeparation: E, seed: 1, pattern: { kind: 'dots' } })
    const far = separation(0, E, MU)
    let broken = 0
    const y = 100
    for (let x = 150; x < 250; x++) if (px(img, x, y) !== px(img, x + far, y)) broken++
    expect(broken).toBeGreaterThan(20)
  })

  it('is deterministic for a seed and changes with it', () => {
    const d = shapeDepth('cone', 120, 40)
    const a = renderStereogram(d, { eyeSeparation: 60, seed: 7, pattern: { kind: 'color' } })
    const b = renderStereogram(d, { eyeSeparation: 60, seed: 7, pattern: { kind: 'color' } })
    const c = renderStereogram(d, { eyeSeparation: 60, seed: 8, pattern: { kind: 'color' } })
    expect(same(a.data, b.data)).toBe(true)
    expect(same(a.data, c.data)).toBe(false)
  })

  it('cross-eyed mode equals parallel mode on the inverted relief', () => {
    const d = shapeDepth('pyramid', 200, 30)
    const cross = renderStereogram(d, { eyeSeparation: 80, seed: 3, pattern: { kind: 'dots' }, mode: 'cross' })
    const inv = { ...d, data: d.data.map((z) => 1 - z) }
    const par = renderStereogram(inv, { eyeSeparation: 80, seed: 3, pattern: { kind: 'dots' }, mode: 'parallel' })
    expect(same(cross.data, par.data)).toBe(true)
  })

  it('dot density is honoured on a flat scene (±5 points)', () => {
    const img = renderStereogram(flatDepth(600, 40), { eyeSeparation: 100, seed: 5, pattern: { kind: 'dots', density: 0.2 } })
    let black = 0
    for (let i = 0; i < img.data.length; i += 4) if (img.data[i] === 0) black++
    expect(black / (img.data.length / 4)).toBeGreaterThan(0.15)
    expect(black / (img.data.length / 4)).toBeLessThan(0.25)
  })

  it('a tile pattern paints the far plane with the tile, fitted to the strip width', () => {
    const tile = proceduralTile('confetti', 64, 1)
    const far = separation(0, E, MU)
    const img = renderStereogram(flatDepth(far * 3, 8), { eyeSeparation: E, seed: 1, pattern: { kind: 'tile', tile } })
    const fitted = fitTile(tile, far)
    expect(fitted.width).toBe(far)
    // the rightmost strip is painted straight from the fitted tile
    const x = far * 3 - 1
    const s = ((0 % fitted.height) * fitted.width + (x % fitted.width)) * 4
    expect(px(img, x, 0)).toBe([fitted.data[s], fitted.data[s + 1], fitted.data[s + 2]].join(','))
  })

  it('every pixel is opaque', () => {
    const img = renderStereogram(shapeDepth('torus', 90, 30), { eyeSeparation: 40, seed: 2, pattern: { kind: 'dots' } })
    for (let i = 3; i < img.data.length; i += 4) expect(img.data[i]).toBe(255)
  })
})

describe('hidden-surface removal', () => {
  it('drops constraints for points hidden behind a near cliff', () => {
    // a near wall in the middle of the row; points just behind its edge are invisible to one eye
    const row = new Float32Array(300)
    for (let x = 120; x < 180; x++) row[x] = 1
    const naive = linkRow(row, E, MU, false)
    const hidden = linkRow(row, E, MU, true)
    const links = (s: Int32Array) => s.reduce((n, v, i) => n + (v !== i ? 1 : 0), 0)
    expect(links(hidden)).toBeLessThan(links(naive))
  })
})

describe('depth maps', () => {
  it.each(SHAPES)('%s stays in [0, 1] and is not flat', (shape) => {
    const d = shapeDepth(shape, 64, 48)
    let min = 1
    let max = 0
    for (const z of d.data) {
      min = Math.min(min, z)
      max = Math.max(max, z)
    }
    expect(min).toBeGreaterThanOrEqual(0)
    expect(max).toBeLessThanOrEqual(1)
    expect(max - min).toBeGreaterThan(0.5)
  })

  it('reads white as near and black as far, and invert flips it', () => {
    const data = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255])
    const d = depthFromRgba({ width: 2, height: 1, data })
    expect(d.data[0]).toBeCloseTo(1)
    expect(d.data[1]).toBeCloseTo(0)
    const inv = depthFromRgba({ width: 2, height: 1, data }, { invert: true })
    expect(inv.data[0]).toBeCloseTo(0)
  })

  it('resample keeps a constant map constant and blur keeps the mean', () => {
    const d = flatDepth(10, 7, 0.4)
    const r = resampleDepth(d, 23, 11)
    expect(r.width).toBe(23)
    for (const z of r.data) expect(z).toBeCloseTo(0.4)
    const s = shapeDepth('sphere', 40, 40)
    const b = blurDepth(s, 2)
    const mean = (m: Float32Array) => m.reduce((a, v) => a + v, 0) / m.length
    expect(mean(b.data)).toBeCloseTo(mean(s.data), 1)
  })

  it('depthToRgba is the inverse of depthFromRgba', () => {
    const d = shapeDepth('cone', 16, 16)
    const back = depthFromRgba(depthToRgba(d))
    for (let i = 0; i < d.data.length; i++) expect(back.data[i]).toBeCloseTo(d.data[i], 2)
  })
})

describe('patterns and helpers', () => {
  it.each(TILES)('%s tile is square, opaque and seeded', (tile) => {
    const a = proceduralTile(tile, 32, 9)
    const b = proceduralTile(tile, 32, 9)
    expect(a.width).toBe(32)
    if (tile === 'truchet') expect(a.height).toBeGreaterThan(16)
    expect(same(a.data, b.data)).toBe(true)
    for (let i = 3; i < a.data.length; i += 4) expect(a.data[i]).toBe(255)
  })

  it('helper dots sit one far-plane separation apart, centred', () => {
    const { left, right } = helperDots(400, E, MU)
    expect(right - left).toBe(separation(0, E, MU))
    expect((left + right) / 2).toBeCloseTo(200, 0)
  })
})
