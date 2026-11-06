// FOUNDER-CASES.md as code (Flywheel Standard rule 18c): known answers a release must still give.
import { describe, expect, it } from 'vitest'
import { flatDepth, shapeDepth } from './depth'
import { renderStereogram, separation } from './stereogram'
import { DEFAULT_PARAMS, decodeParams } from './params'

describe('founder cases', () => {
  it('#1 default settings follow the 1994 paper: E=180, μ=1/3, far strip 90 px, near 72 px', () => {
    expect(DEFAULT_PARAMS.eyeSeparation).toBe(180)
    expect(DEFAULT_PARAMS.depth).toBeCloseTo(1 / 3)
    expect(separation(0, 180, 1 / 3)).toBe(90)
    expect(separation(1, 180, 1 / 3)).toBe(72)
  })

  it('#2 the sphere link, seed 1994, renders the same first row on every machine', () => {
    const d = shapeDepth('sphere', 240, 2)
    const img = renderStereogram(d, { eyeSeparation: 180, seed: 1994, pattern: { kind: 'dots' } })
    // a 16-pixel fingerprint of row 0 — change only with a written reason in docs/DECISIONS.md
    const fp = Array.from({ length: 16 }, (_, i) => (img.data[i * 4] === 0 ? '1' : '0')).join('')
    expect(fp).toBe('0001101001000010')
  })

  it('#3 a flat scene at the A4 preset has 2 px of repeat tolerance nowhere: strict period', () => {
    const E = 600
    const far = separation(0, E, 1 / 3)
    const img = renderStereogram(flatDepth(far * 4, 1), { eyeSeparation: E, seed: 3, pattern: { kind: 'dots' } })
    for (let x = 0; x + far < far * 4; x++) expect(img.data[x * 4]).toBe(img.data[(x + far) * 4])
  })

  it('#4 a shared link with no parameters is the landing picture: the Discobolus in Iznik ornament', () => {
    expect(DEFAULT_PARAMS.scene).toEqual({ kind: 'figure', id: 'smk_discobolus' })
    expect(DEFAULT_PARAMS.pattern).toBe('lib:iznik-447013')
    expect(decodeParams('')).toEqual(DEFAULT_PARAMS)
  })
})
