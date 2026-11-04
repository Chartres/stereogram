// The library: CC0 sculptures baked to depth maps and Met Open Access ornament tiles, each with
// its provenance (scripts/bake-library.mjs writes provenance.json and public/library/**).
import prov from './provenance.json'
import { depthFromRgba, type DepthMap, type Rgba } from '@/domain/depth'

export interface Figure {
  id: string
  /** bust · figure · animal · relief · object, so the book can interleave */
  kind?: string
  /** false keeps a figure in the picker but out of the book's walk */
  book?: boolean
  title: string
  file: string
  source: string
  licence: string
  url: string
  credit: string
}
export interface Pattern extends Figure {
  date?: string
}

export const FIGURES: Figure[] = prov.figures
export const PATTERNS: Pattern[] = prov.patterns
/** The picker opens on the pieces worth opening on (mobile-ux: every picker opens at the probable answer), then the rest by title. */
const FEATURED = ['smk_discobolus', 'carved_wooden_elephant', 'chartres', 'smk_dying_gaul', 'bull_head', 'si_roosevelt_relief', 'smk_laocoon', 'bronze_ray_statue', 'marble_bust_01', 'smk_apollo_belvedere', 'lion_head', 'si_western_paradise', 'gothic_statue', 'smk_moses', 'concrete_cat_statue', 'si_lincoln_hands', 'lambis_shell', 'smk_belvedere_torso']
export const FEATURED_FIRST: Figure[] = [...FEATURED.map((id) => FIGURES.find((f) => f.id === id)).filter((f): f is Figure => !!f), ...FIGURES.filter((f) => !FEATURED.includes(f.id))]
export const FIGURE_IDS = FIGURES.map((f) => f.id)
export const PATTERN_IDS = PATTERNS.map((p) => p.id)

export const figureById = (id: string) => FIGURES.find((f) => f.id === id)
export const patternById = (id: string) => PATTERNS.find((p) => p.id === id)

async function fetchRgba(file: string): Promise<Rgba> {
  const blob = await (await fetch(file)).blob()
  const bmp = await createImageBitmap(blob)
  const c = document.createElement('canvas')
  c.width = bmp.width
  c.height = bmp.height
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bmp, 0, 0)
  bmp.close()
  const img = ctx.getImageData(0, 0, c.width, c.height)
  return { width: img.width, height: img.height, data: img.data }
}

const depthCache = new Map<string, Promise<DepthMap>>()
const tileCache = new Map<string, Promise<Rgba>>()

export function loadFigure(id: string): Promise<DepthMap> {
  const f = figureById(id)
  if (!f) return Promise.reject(new Error(`unknown figure ${id}`))
  if (!depthCache.has(id)) depthCache.set(id, fetchRgba(f.file).then((r) => depthFromRgba(r)))
  return depthCache.get(id)!
}

export function loadPattern(id: string): Promise<Rgba> {
  const p = patternById(id)
  if (!p) return Promise.reject(new Error(`unknown pattern ${id}`))
  if (!tileCache.has(id)) tileCache.set(id, fetchRgba(p.file))
  return tileCache.get(id)!
}
