// @vitest-environment node
import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { plateFromPath, plateHtml } from './plateMeta'

const template = readFileSync('index.html', 'utf8')

describe('plate link cards', () => {
  it('gives plate 5 its own title, canonical and image', () => {
    const h = plateHtml(template, 5)
    expect(h).toContain('<title>Plate 5: what is hidden here? · Stereogram</title>')
    expect(h).toContain('<link rel="canonical" href="https://stereogram.dravec.org/plate/5/"')
    expect(h).toContain('property="og:image" content="https://stereogram.dravec.org/og/plate-5.jpg"')
    expect(h).toContain('name="twitter:image" content="https://stereogram.dravec.org/og/plate-5.jpg"')
    expect(h).not.toContain('content="https://stereogram.dravec.org/og.png"')
  })
  it('refuses a template that lost a tag, so a build cannot ship a blank card', () => {
    expect(() => plateHtml('<html><head><title>x</title></head></html>', 1)).toThrow(/missing/)
  })
  it('reads the plate number from the path', () => {
    expect(plateFromPath('/plate/42/')).toBe(42)
    expect(plateFromPath('/plate/42')).toBe(42)
    expect(plateFromPath('/')).toBeNull()
    expect(plateFromPath('/plate/x/')).toBeNull()
  })
})
