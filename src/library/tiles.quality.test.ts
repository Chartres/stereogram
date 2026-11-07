// @vitest-environment node
// No museum tile ships that a stereogram cannot use (src/domain/tileQuality.ts, docs/PATTERNS.md).
// A new bake that brings in a blank-paper sampler or a striped band fails here, not on a phone.
import path from 'path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { tileQuality } from '@/domain/tileQuality'
import prov from './provenance.json'

describe('every library pattern passes the pattern check', () => {
  it.each(prov.patterns.map((p) => [p.id, p.file]))('%s', async (id, file) => {
    const { data, info } = await sharp(path.join('public', file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const q = tileQuality({ width: info.width, height: info.height, data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length) })
    expect(q.ok, `${id}: ${q.reasons.join('; ')}`).toBe(true)
  })
})
