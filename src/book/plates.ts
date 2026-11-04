// The book of plates: a fixed, deterministic set of (figure, pattern, seed) specs. Every plate is
// reproduced pixel for pixel by the client renderer, so the book ships as a few hundred bytes of
// specs plus the library, not as 100 PNGs. ponytail: pairing is index arithmetic, curate later.
import { FIGURES, PATTERNS } from '@/library'
import { DEFAULT_PARAMS, type Params } from '@/domain/params'
import { mulberry32 } from '@/domain/prng'

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
  // a seeded walk through figures and patterns: every figure appears before any repeats,
  // and the pairing does not depend on the counts sharing a factor (it did: 7 and 42)
  const rnd = mulberry32(1862)
  const shuffled = <T,>(a: T[]) => a.map((v) => [rnd(), v] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1])
  // interleave kinds (figure, animal, relief, object, bust…) so no run of busts: round-robin over per-kind queues
  const eligible = FIGURES.filter((f) => f.book !== false)
  const byKind = new Map<string, typeof eligible>()
  for (const f of shuffled(eligible)) byKind.set(f.kind ?? 'object', [...(byKind.get(f.kind ?? 'object') ?? []), f])
  const queues = [...byKind.values()]
  const figs: typeof eligible = []
  for (let i = 0; figs.length < eligible.length; i++) for (const q of queues) if (q[Math.floor(i / 1)] && figs.length < eligible.length) figs.push(q[i])
  const pats = shuffled(PATTERNS)
  for (let n = 1; n <= PLATE_COUNT; n++) {
    const f = figs[(n - 1) % figs.length]
    const cycle = Math.floor((n - 1) / figs.length)
    const p = pats[(n * 11 + cycle * 13) % pats.length]
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
