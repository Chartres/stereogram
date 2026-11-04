// Everything a stereogram is made of, as plain data: the UI edits it, the URL carries it,
// tests pin it. Scenes that need a file (upload, drawing) cannot travel in a link.
import { SHAPES, type Shape } from './depth'
import { TILES, type Tile } from './pattern'
import type { ViewMode } from './stereogram'
import prov from '../library/provenance.json'

const FIGURE_IDS: readonly string[] = prov.figures.map((f: { id: string }) => f.id)
const PATTERN_IDS: readonly string[] = prov.patterns.map((p: { id: string }) => p.id)

export type Scene =
  | { kind: 'shape'; shape: Shape }
  | { kind: 'figure'; id: string } // a baked sculpture from the library
  | { kind: 'text'; text: string }
  | { kind: 'draw' }
  | { kind: 'image' }

/** 'lib:<id>' is an ornament tile from the library. */
export type PatternChoice = 'dots' | 'color' | Tile | 'image' | `lib:${string}`

export interface Params {
  scene: Scene
  width: number
  height: number
  eyeSeparation: number
  /** μ, 0.1–0.7 */
  depth: number
  mode: ViewMode
  hiddenSurface: boolean
  pattern: PatternChoice
  /** share of black pixels for 'dots' */
  density: number
  seed: number
  helpers: boolean
  /** flip near/far for uploaded depth maps */
  invert: boolean
  /** blur radius for uploaded / drawn maps, px */
  smooth: number
}

export interface SizePreset {
  id: string
  label: string
  width: number
  height: number
  eyeSeparation: number
}

/** 'screen' is filled in by the UI from the visible canvas (1:1 CSS pixels = what you see is what you download). */
export const SIZE_PRESETS: SizePreset[] = [
  { id: 'screen', label: 'This screen', width: 0, height: 0, eyeSeparation: 180 },
  { id: 'hd', label: 'Desktop 1920×1080', width: 1920, height: 1080, eyeSeparation: 240 },
  { id: 'phone', label: 'Phone wallpaper 1170×2532', width: 1170, height: 2532, eyeSeparation: 220 },
  { id: 'square', label: 'Square 2048×2048', width: 2048, height: 2048, eyeSeparation: 260 },
  { id: 'a4', label: 'Print A4 300 dpi', width: 3508, height: 2480, eyeSeparation: 600 },
]

export const LIMITS = {
  width: [64, 4096] as const,
  height: [64, 4096] as const,
  eyeSeparation: [40, 1000] as const,
  depth: [0.1, 0.7] as const,
  density: [0.1, 0.9] as const,
  smooth: [0, 20] as const,
  seed: [0, 999_999_999] as const,
  text: 60,
}

export const DEFAULT_PARAMS: Params = {
  scene: { kind: 'shape', shape: 'sphere' },
  width: 960,
  height: 600,
  eyeSeparation: 180,
  depth: 1 / 3,
  mode: 'parallel',
  hiddenSurface: true,
  pattern: 'dots',
  density: 0.5,
  seed: 1994,
  helpers: true,
  invert: false,
  smooth: 2,
}

const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v))

export function isPatternChoice(v: string): v is PatternChoice {
  if (v.startsWith('lib:')) return PATTERN_IDS.includes(v.slice(4))
  return v === 'dots' || v === 'color' || v === 'image' || (TILES as readonly string[]).includes(v)
}

export const isFigureId = (id: string) => FIGURE_IDS.includes(id)

/** True when the params can be reproduced from a link alone (no file involved). */
export function isShareable(p: Params): boolean {
  return (p.scene.kind === 'shape' || p.scene.kind === 'text' || p.scene.kind === 'figure') && p.pattern !== 'image'
}

export function encodeParams(p: Params): string {
  const q = new URLSearchParams()
  if (p.scene.kind === 'shape') q.set('shape', p.scene.shape)
  else if (p.scene.kind === 'figure') q.set('figure', p.scene.id)
  else if (p.scene.kind === 'text') q.set('text', p.scene.text)
  else q.set('scene', p.scene.kind)
  q.set('w', String(p.width))
  q.set('h', String(p.height))
  q.set('e', String(p.eyeSeparation))
  q.set('mu', p.depth.toFixed(2))
  q.set('mode', p.mode)
  if (!p.hiddenSurface) q.set('hs', '0')
  q.set('pattern', p.pattern)
  if (p.pattern === 'dots') q.set('density', p.density.toFixed(2))
  q.set('seed', String(p.seed))
  if (!p.helpers) q.set('helpers', '0')
  if (p.invert) q.set('invert', '1')
  q.set('smooth', String(p.smooth))
  return q.toString()
}

/** Decode a query string; anything missing or out of range falls back to `base` (a trust boundary: links are typed by strangers). */
export function decodeParams(query: string, base: Params = DEFAULT_PARAMS): Params {
  const q = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query)
  const num = (key: string, range: readonly [number, number], fallback: number) => {
    const raw = q.get(key)
    if (raw === null) return fallback
    const n = Number(raw)
    return Number.isFinite(n) ? clamp(n, range) : fallback
  }
  const p: Params = { ...base, scene: { ...base.scene } }
  const shape = q.get('shape')
  const figure = q.get('figure')
  const text = q.get('text')
  if (shape && (SHAPES as readonly string[]).includes(shape)) p.scene = { kind: 'shape', shape: shape as Shape }
  else if (figure && isFigureId(figure)) p.scene = { kind: 'figure', id: figure }
  else if (text !== null) p.scene = { kind: 'text', text: text.slice(0, LIMITS.text) }
  p.width = Math.round(num('w', LIMITS.width, base.width))
  p.height = Math.round(num('h', LIMITS.height, base.height))
  p.eyeSeparation = Math.round(num('e', LIMITS.eyeSeparation, base.eyeSeparation))
  p.depth = num('mu', LIMITS.depth, base.depth)
  const mode = q.get('mode')
  if (mode === 'parallel' || mode === 'cross') p.mode = mode
  if (q.get('hs') === '0') p.hiddenSurface = false
  const pattern = q.get('pattern')
  if (pattern && isPatternChoice(pattern) && pattern !== 'image') p.pattern = pattern
  p.density = num('density', LIMITS.density, base.density)
  p.seed = Math.round(num('seed', LIMITS.seed, base.seed))
  if (q.get('helpers') === '0') p.helpers = false
  if (q.get('invert') === '1') p.invert = true
  p.smooth = Math.round(num('smooth', LIMITS.smooth, base.smooth))
  return p
}
