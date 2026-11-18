import { describe, expect, it } from 'vitest'
import { entrySource } from './referrer'

describe('entrySource (where a visit came from, for page_view)', () => {
  it('names the referring host', () => {
    expect(entrySource('https://www.reddit.com/r/MagicEye/comments/x', '', 'stereogram.dravec.org')).toBe('reddit.com')
    expect(entrySource('https://news.ycombinator.com/item?id=1', '', 'stereogram.dravec.org')).toBe('news.ycombinator.com')
  })
  it('prefers utm_source over the referrer', () => {
    expect(entrySource('https://t.co/abc', '?utm_source=smk&x=1', 'stereogram.dravec.org')).toBe('smk')
  })
  it('is null for internal navigation, no referrer, or junk', () => {
    expect(entrySource('https://stereogram.dravec.org/plate/6/', '', 'stereogram.dravec.org')).toBeNull()
    expect(entrySource('', '', 'stereogram.dravec.org')).toBeNull()
    expect(entrySource('not a url', '', 'stereogram.dravec.org')).toBeNull()
  })
  it('caps utm_source length', () => {
    expect(entrySource('', `?utm_source=${'a'.repeat(200)}`, 'h')!.length).toBe(40)
  })
})
