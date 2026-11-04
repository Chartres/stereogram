// The contrast gate (taste.md): ratios computed from the tokens, not promised in DESIGN.md.
import { describe, expect, it } from 'vitest'
import css from '../tokens.css?raw'

function tokens(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)) out[m[1]] = m[2]
  return out
}

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

// Every pair the UI uses, with its WCAG floor. A new pair is added here in the same commit.
const PAIRS: [string, string, number][] = [
  ['ink', 'paper', 4.5],
  ['ink', 'paper-2', 4.5],
  ['ink-soft', 'paper', 4.5],
  ['ink-soft', 'paper-2', 4.5],
  ['accent', 'paper', 4.5], // accent as text (links, live line)
  ['paper', 'accent', 4.5], // paper text on the filled primary slab
  ['edge', 'paper', 3], // control edges and the focus/tab rule
  ['accent', 'paper-2', 3], // focus rule on a filled field
]

describe('design tokens', () => {
  const t = tokens()
  it.each(PAIRS)('%s on %s ≥ %s:1', (fg, bg, min) => {
    expect(t[fg], `token ${fg}`).toBeDefined()
    expect(t[bg], `token ${bg}`).toBeDefined()
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(min)
  })
})
