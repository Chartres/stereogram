// "How fine can you see depth": the arithmetic of a browser stereoacuity measurement, kept
// honest. Pure functions; the UI supplies the screen (px per mm), the distance (blind-spot
// method) and the answers. Not a clinical test, and the result says so (ASTEROID's test–retest
// band is a factor of 4.3: Vancleef et al. 2019, PMC6396686).

/** ISO/IEC 7810 ID-1 card width, the ruler everyone has. */
export const CARD_MM = 85.6
/** Its short side: on a phone the long side is wider than the screen, so the card stands upright. */
export const CARD_SHORT_MM = 53.98
/** The blind spot sits about 13.5° temporal of fixation (UW "virtual chinrest", Li et al. 2020). */
export const BLIND_SPOT_DEG = 13.5
const ARCSEC = Math.PI / 180 / 3600

export const pxPerMm = (cardWidthPx: number, mm: number = CARD_MM) => cardWidthPx / mm

/** Viewing distance from the fixation→vanish separation on screen. */
export function distanceMm(separationPx: number, pxPerMmValue: number): number {
  return separationPx / pxPerMmValue / Math.tan((BLIND_SPOT_DEG * Math.PI) / 180)
}

/** Disparity in arcseconds → pixels of shift on this screen at this distance. */
export function arcsecToPx(arcsec: number, distMm: number, pxPerMmValue: number): number {
  return Math.tan(arcsec * ARCSEC) * distMm * pxPerMmValue
}

export function pxToArcsec(px: number, distMm: number, pxPerMmValue: number): number {
  return Math.atan(px / pxPerMmValue / distMm) / ARCSEC
}

/** The floors the result must print: one whole pixel, and the quarter pixel sub-pixel drawing can honestly claim. */
export function floors(distMm: number, pxPerMmValue: number) {
  const pixel = pxToArcsec(1, distMm, pxPerMmValue)
  return { pixelArcsec: pixel, subpixelArcsec: pixel / 4 }
}

export interface Staircase {
  /** current disparity, arcsec */
  level: number
  /** consecutive correct answers at this level (1-up / 2-down) */
  streak: number
  reversals: number[]
  lastDirection: 'down' | 'up' | null
  trials: number
  done: boolean
}

export const STAIRCASE = { start: 400, min: 2, max: 3600, down: 0.7, up: 1 / 0.7, reversalsToStop: 6, maxTrials: 40 }

export function startStaircase(start = STAIRCASE.start): Staircase {
  return { level: start, streak: 0, reversals: [], lastDirection: null, trials: 0, done: false }
}

/** 1-up/2-down converges on the 70.7 % point. Clamped to the honest range. */
export function step(s: Staircase, correct: boolean): Staircase {
  if (s.done) return s
  const n: Staircase = { ...s, reversals: [...s.reversals], trials: s.trials + 1 }
  let dir: 'down' | 'up' | null = null
  if (correct) {
    n.streak = s.streak + 1
    if (n.streak >= 2) {
      n.level = Math.max(STAIRCASE.min, s.level * STAIRCASE.down)
      n.streak = 0
      dir = 'down'
    }
  } else {
    n.streak = 0
    n.level = Math.min(STAIRCASE.max, s.level * STAIRCASE.up)
    dir = 'up'
  }
  if (dir && s.lastDirection && dir !== s.lastDirection) n.reversals.push(s.level)
  if (dir) n.lastDirection = dir
  n.done = n.reversals.length >= STAIRCASE.reversalsToStop || n.trials >= STAIRCASE.maxTrials
  return n
}

/** Threshold = geometric mean of the last four reversals (or all, if fewer); null until two reversals exist. */
export function threshold(s: Staircase): number | null {
  const r = s.reversals.slice(-4)
  if (r.length < 2) return null
  return Math.exp(r.reduce((a, v) => a + Math.log(v), 0) / r.length)
}

/** The honest band: ASTEROID's test–retest ratio of 4.3, split either side. */
export function band(arcsec: number): [number, number] {
  const k = Math.sqrt(4.3)
  return [arcsec / k, arcsec * k]
}
