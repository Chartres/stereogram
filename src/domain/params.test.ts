import { describe, expect, it } from 'vitest'
import { DEFAULT_PARAMS, decodeParams, encodeParams, isShareable, type Params } from './params'

describe('params ↔ link', () => {
  it('round-trips a shape scene', () => {
    const p: Params = { ...DEFAULT_PARAMS, scene: { kind: 'shape', shape: 'torus' }, seed: 42, depth: 0.5, pattern: 'weave', helpers: false, mode: 'cross' }
    expect(decodeParams(encodeParams(p))).toEqual(p)
  })

  it('round-trips a text scene with unicode', () => {
    const p: Params = { ...DEFAULT_PARAMS, scene: { kind: 'text', text: 'Ahoj Žofie' } }
    expect(decodeParams(encodeParams(p)).scene).toEqual({ kind: 'text', text: 'Ahoj Žofie' })
  })

  it('clamps hostile numbers and ignores unknown values', () => {
    const p = decodeParams('?w=999999&h=-5&e=abc&mu=9&shape=cube&pattern=evil&seed=1e99&mode=up')
    expect(p.width).toBe(4096)
    expect(p.height).toBe(64)
    expect(p.eyeSeparation).toBe(DEFAULT_PARAMS.eyeSeparation)
    expect(p.depth).toBe(0.7)
    expect(p.scene).toEqual(DEFAULT_PARAMS.scene)
    expect(p.pattern).toBe(DEFAULT_PARAMS.pattern)
    expect(p.seed).toBe(999_999_999)
    expect(p.mode).toBe('parallel')
  })

  it('truncates text to the limit', () => {
    const p = decodeParams('?text=' + 'x'.repeat(500))
    expect((p.scene as { text: string }).text).toHaveLength(60)
  })

  it('only file-free scenes are shareable', () => {
    expect(isShareable(DEFAULT_PARAMS)).toBe(true)
    expect(isShareable({ ...DEFAULT_PARAMS, scene: { kind: 'image' } })).toBe(false)
    expect(isShareable({ ...DEFAULT_PARAMS, pattern: 'image' })).toBe(false)
  })
})
