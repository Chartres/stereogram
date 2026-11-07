// The book of plates: 100 (figure, pattern, seed) specs, frozen in plates.json. Every plate is
// reproduced pixel for pixel by the client renderer, so the book ships as specs plus the library.
//
// Frozen because a plate link travels: people received /plate/<n>/ by email and WhatsApp on
// 6 Nov 2026, and a reshuffle (the 7 Nov tile pruning moved 29 plates) would change the picture
// behind a link they already have. The list is the book as deployed on 6 Nov. If a figure or
// tile later leaves the library, that plate alone takes another from the same family (katagami
// for katagami), chosen by plate number, so the rest of the book does not move.
import { FIGURES, PATTERNS } from '@/library'
import { DEFAULT_PARAMS, type Params } from '@/domain/params'
import frozen from './plates.json'

export interface Plate {
  n: number
  figure: string
  pattern: string
  seed: number
  depth: number
}

export const PLATE_COUNT = 100

const family = (id: string) => id.split(/[-_]/)[0]

function substitute(id: string, pool: string[], n: number): string {
  if (pool.includes(id)) return id
  const same = pool.filter((p) => family(p) === family(id))
  const from = same.length ? same : pool
  return from[(n * 7) % from.length]
}

export function plates(): Plate[] {
  if (!FIGURES.length || !PATTERNS.length) return []
  const figs = FIGURES.map((f) => f.id).sort()
  const pats = PATTERNS.map((p) => p.id).sort()
  return (frozen as Plate[]).map((p) => ({ ...p, figure: substitute(p.figure, figs, p.n), pattern: substitute(p.pattern, pats, p.n) }))
}

export function plateParams(plate: Plate, width: number, height: number): Params {
  return {
    ...DEFAULT_PARAMS,
    scene: { kind: 'figure', id: plate.figure },
    pattern: `lib:${plate.pattern}`,
    seed: plate.seed,
    depth: plate.depth,
    width,
    height,
    eyeSeparation: 180,
  }
}
