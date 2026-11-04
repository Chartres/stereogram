// The book of plates: a fixed, deterministic set of (figure, pattern, seed) specs. Every plate is
// reproduced pixel for pixel by the client renderer, so the book ships as a few hundred bytes of
// specs plus the library, not as 100 PNGs. ponytail: pairing is index arithmetic, curate later.
import { FIGURES, PATTERNS } from '@/library'
import { DEFAULT_PARAMS, type Params } from '@/domain/params'

export interface Plate {
  n: number
  figure: string
  pattern: string
  seed: number
  depth: number
}

export const PLATE_COUNT = 100

export function plates(): Plate[] {
  const out: Plate[] = []
  if (!FIGURES.length || !PATTERNS.length) return out
  for (let n = 1; n <= PLATE_COUNT; n++) {
    const f = FIGURES[(n * 7) % FIGURES.length]
    const p = PATTERNS[(n * 11) % PATTERNS.length]
    out.push({ n, figure: f.id, pattern: p.id, seed: 1000 + n * 37, depth: n % 3 === 0 ? 0.25 : 1 / 3 })
  }
  return out
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
