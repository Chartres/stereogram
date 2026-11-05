// @vitest-environment node
// Every shipped library file has a provenance entry with a licence and a source URL, and every
// entry points at a file that exists. The credit line is what prints under the picture (VIII).
import { existsSync, readdirSync } from 'fs'
import { describe, expect, it } from 'vitest'
import prov from './provenance.json'
import { plates, PLATE_COUNT } from '@/book/plates'
import { fitDepth, shapeDepth } from '@/domain/depth'
import { decodeParams, encodeParams, DEFAULT_PARAMS, isPatternChoice } from '@/domain/params'

const onDisk = (dir: string): string[] => (existsSync(dir) ? readdirSync(dir).filter((f: string) => f.endsWith('.png')).map((f: string) => `/library/${dir.split('/').pop()}/${f}`) : [])

describe('library provenance', () => {
  it('has figures and patterns', () => {
    expect(prov.figures.length).toBeGreaterThanOrEqual(10)
    expect(prov.patterns.length).toBeGreaterThanOrEqual(10)
  })
  it.each([...prov.figures, ...prov.patterns].map((e) => [e.id, e]))('%s carries licence, source url and credit, and its file exists', (_id, e) => {
    expect(['CC0', 'CC BY-SA 3.0', 'CC BY-SA 4.0', 'CC BY 4.0', 'Public domain']).toContain(e.licence)
    if (e.licence.startsWith('CC BY')) expect(e.credit).toMatch(/by |CC BY/i) // attribution licences name the author
    expect(e.url).toMatch(/^https:\/\//)
    expect(e.credit).toContain(e.title)
    expect(existsSync('public' + e.file)).toBe(true)
  })
  it('every file on disk is accounted for (no uncredited asset ships)', () => {
    const listed = new Set([...prov.figures, ...prov.patterns].map((e) => e.file))
    for (const f of [...onDisk('public/library/figures'), ...onDisk('public/library/patterns')]) expect(listed.has(f), f).toBe(true)
  })
})

describe('book of plates', () => {
  it('has the full count, deterministic, every plate pointing at a real figure and pattern', () => {
    const a = plates()
    const b = plates()
    expect(a).toHaveLength(PLATE_COUNT)
    expect(a).toEqual(b)
    const f = new Set(prov.figures.map((x) => x.id))
    const p = new Set(prov.patterns.map((x) => x.id))
    for (const pl of a) {
      expect(f.has(pl.figure)).toBe(true)
      expect(p.has(pl.pattern)).toBe(true)
    }
    expect(new Set(a.map((x) => `${x.figure}/${x.pattern}`)).size).toBeGreaterThan(PLATE_COUNT / 2)
  })
})

describe('figures in params', () => {
  it('round-trips a figure scene and a library pattern through a link', () => {
    const p = { ...DEFAULT_PARAMS, scene: { kind: 'figure' as const, id: prov.figures[0].id }, pattern: `lib:${prov.patterns[0].id}` as const, depth: 0.5 }
    expect(decodeParams(encodeParams(p))).toEqual(p)
  })
  it('rejects unknown figure and pattern ids', () => {
    expect(decodeParams('?figure=nope&pattern=lib:nope')).toEqual(DEFAULT_PARAMS)
    expect(isPatternChoice('lib:nope')).toBe(false)
  })
  it('fitDepth centres a figure on the far plane', () => {
    const d = fitDepth(shapeDepth('sphere', 64, 64), 200, 100)
    expect(d.width).toBe(200)
    expect(d.data[0]).toBe(0)
    expect(d.data[50 * 200 + 100]).toBeGreaterThan(0.9)
    expect(d.data[50 * 200 + 10]).toBe(0)
  })
})

describe('refused tiles stay out', () => {
  it('no mount crop or non-pattern hit removed by a person is back in the library', () => {
    const refused = ['katagami-61835', 'katagami-61838', 'floral-207665', 'floral-436525', 'floral-437999', 'floral-73142', 'floral-76988', 'floral-910072']
    for (const id of refused) expect(prov.patterns.some((p) => p.id === id), id).toBe(false)
  })
})
