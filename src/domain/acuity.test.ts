import { describe, expect, it } from 'vitest'
import { arcsecToPx, band, distanceMm, floors, pxPerMm, pxToArcsec, startStaircase, step, threshold } from './acuity'

describe('stereoacuity arithmetic', () => {
  it('a card 324 px wide on a 96-dpi screen is 3.78 px/mm', () => {
    expect(pxPerMm(324)).toBeCloseTo(3.785, 2)
  })
  it('blind spot 450 px from fixation at 3.78 px/mm puts the eye about 50 cm away', () => {
    expect(distanceMm(450, 3.785)).toBeCloseTo(495, -1)
  })
  it('one pixel at 50 cm on a 96-dpi screen is about 109 arcsec, and the sub-pixel floor a quarter of that', () => {
    const f = floors(500, 3.785)
    expect(f.pixelArcsec).toBeCloseTo(109, 0)
    expect(f.subpixelArcsec).toBeCloseTo(27.3, 0)
    expect(arcsecToPx(pxToArcsec(1, 500, 3.785), 500, 3.785)).toBeCloseTo(1, 6)
  })
  it('the band is a factor of 4.3 wide', () => {
    const [lo, hi] = band(60)
    expect(hi / lo).toBeCloseTo(4.3, 5)
  })
})

describe('1-up/2-down staircase', () => {
  it('needs two correct to go down, one wrong to go up, and stops after six reversals', () => {
    let s = startStaircase(400)
    s = step(s, true)
    expect(s.level).toBe(400)
    s = step(s, true)
    expect(s.level).toBeCloseTo(280)
    s = step(s, false)
    expect(s.level).toBeCloseTo(400)
    expect(s.reversals).toHaveLength(1)
    // alternate until done
    let guard = 0
    while (!s.done && guard++ < 100) s = step(step(step(s, true), true), false) // down, then up: one reversal per round
    expect(s.done).toBe(true)
    expect(s.reversals.length).toBeGreaterThanOrEqual(6)
    expect(threshold(s)).toBeGreaterThan(0)
  })
  it('never goes below the honest minimum or above the maximum', () => {
    let s = startStaircase(4)
    for (let i = 0; i < 20; i++) s = step(s, true)
    expect(s.level).toBeGreaterThanOrEqual(2)
    let t = startStaircase(3000)
    for (let i = 0; i < 20; i++) t = step(t, false)
    expect(t.level).toBeLessThanOrEqual(3600)
  })
  it('threshold is null before two reversals', () => {
    expect(threshold(startStaircase())).toBeNull()
  })
})
