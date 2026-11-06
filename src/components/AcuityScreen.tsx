import { useEffect, useRef, useState } from 'react'
import { track } from '@/analytics'
import { arcsecToPx, band, CARD_MM, CARD_SHORT_MM, distanceMm, floors, pxPerMm, startStaircase, step, threshold, type Staircase } from '@/domain/acuity'
import { mulberry32 } from '@/domain/prng'
import { FeedbackCard } from './FeedbackCard'

// "How fine can you see depth." A free-fusion random-dot stereo pair, a 1-up/2-down staircase,
// and a result that prints its own floor and band. Not a clinical test; nothing is stored or
// sent except that a measurement finished. Stimulus after Julesz (1960); method after ASTEROID
// (Vancleef et al. 2019); distance after the UW virtual chinrest (Li et al. 2020).

type Stage = 'card' | 'distance' | 'test' | 'result'
const label = 'text-label uppercase tracking-wide text-ink-soft'
const slab = 'min-h-12 rounded-md bg-accent px-5 font-display text-title text-paper'
const btn = 'min-h-11 rounded-md border border-edge px-4'

function readNum(key: string): number | null {
  try {
    const v = Number(localStorage.getItem(key))
    return v > 0 ? v : null
  } catch {
    return null
  }
}

export function AcuityScreen() {
  const [stage, setStage] = useState<Stage>('card')
  const [cardPx, setCardPx] = useState<number>(() => readNum('acuity:cardPx') ?? 320)
  const [ppm, setPpm] = useState<number | null>(() => readNum('acuity:ppm'))
  // a card's long side (85.6 mm) is wider than a phone screen, so phones measure the short side upright
  const [upright] = useState(() => typeof window !== 'undefined' && window.innerWidth < 600)
  const cardMm = upright ? CARD_SHORT_MM : CARD_MM
  const [dist, setDist] = useState<number | null>(null)
  const [stair, setStair] = useState<Staircase>(startStaircase)
  const [trialSeed, setTrialSeed] = useState(1)
  const [answer] = useState(() => mulberry32(Date.now() & 0xffff))
  const target = useRef<'top' | 'bottom'>('top')
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    track('page_view', { route: 'acuity' })
  }, [])

  function confirmCard() {
    const p = pxPerMm(cardPx, cardMm)
    setPpm(p)
    try {
      localStorage.setItem('acuity:cardPx', String(cardPx))
      localStorage.setItem('acuity:ppm', String(p))
    } catch {
      /* private mode */
    }
    setStage('distance')
  }

  function onVanished(separationPx: number) {
    if (!ppm) return
    setDist(distanceMm(separationPx, ppm))
    setStair(startStaircase())
    target.current = answer() < 0.5 ? 'top' : 'bottom'
    setTrialSeed(1)
    setStage('test')
  }

  function respond(choice: 'top' | 'bottom') {
    const correct = choice === target.current
    const next = step(stair, correct)
    setStair(next)
    setFeedback(correct ? 'Yes.' : 'No, the other one.')
    setTimeout(() => setFeedback(null), 600)
    target.current = answer() < 0.5 ? 'top' : 'bottom'
    setTrialSeed((s) => s + 1)
    if (next.done) {
      setStage('result')
      const f = ppm && dist ? floors(dist, ppm) : null
      track('key_action', { action: 'acuity_done', trials: next.trials, pixel_floor_arcsec: f ? Math.round(f.pixelArcsec) : null })
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-6">
      <h1 className="font-display text-display">How fine can you see depth</h1>
      <p className="mt-4 text-ink-soft">
        A measurement, honestly labelled. Three steps: tell the page how big a pixel is, tell it how far your eyes are, then
        say which square stands out until the page has heard enough. Nothing you do here is stored or sent, except that a
        measurement finished. This is not a clinical test; an orthoptist's Randot or TNO card is.
      </p>

      {stage === 'card' && (
        <section className="mt-12">
          <h2 className="font-display text-title">1 · A bank card against the screen</h2>
          <p className="mt-2 text-ink-soft">
            Lay a bank or ID card flat on the screen,{' '}
            {upright ? <strong>standing upright (portrait), short side across</strong> : <strong>lying on its long side (landscape)</strong>}, with its left
            edge on the box's left edge. Drag the slider until the box is exactly as wide as the card ({cardMm} mm).
          </p>
          <div data-testid="card-box" className="relative mt-4 rounded-[10px] bg-accent" style={{ width: cardPx, aspectRatio: upright ? '53.98 / 85.6' : '85.6 / 53.98' }}>
            <div className={`absolute rounded-[3px] bg-paper/70 ${upright ? 'left-[30%] top-[9%] h-[14%] w-[22%]' : 'left-[9%] top-[30%] h-[22%] w-[14%]'}`} aria-hidden="true" />
            <span className="absolute bottom-2 right-3 text-label uppercase tracking-wide text-paper">{upright ? 'short side ↔' : 'long side ↔'}</span>
          </div>
          <input type="range" aria-label="Card width" min={160} max={Math.min(700, Math.floor(window.innerWidth * 0.9))} value={cardPx} onChange={(e) => setCardPx(Number(e.target.value))} />
          <p className={label}>{cardPx} px for {cardMm} mm → {pxPerMm(cardPx, cardMm).toFixed(2)} px per mm</p>
          <button type="button" className={`${slab} mt-4`} onClick={confirmCard}>
            It matches
          </button>
        </section>
      )}

      {stage === 'distance' && ppm && <BlindSpot ppm={ppm} onVanished={onVanished} />}

      {stage === 'test' && ppm && dist && (
        <section className="mt-12">
          <h2 className="font-display text-title">3 · Which square stands out?</h2>
          <p className="mt-2 text-ink-soft">
            Look through the page so the two panels fuse into three; in the middle one, a square sits in the top or the
            bottom half, closer than the rest. Say which. Guess when unsure; the page expects that.
          </p>
          <p className={`${label} mt-2`}>
            Trial {stair.trials + 1} · disparity {Math.round(stair.level)}″ ({arcsecToPx(stair.level, dist, ppm).toFixed(2)} px) · {Math.round(dist / 10)} cm
          </p>
          <StereoPair key={trialSeed} seed={trialSeed * 7919} ppm={ppm} shiftPx={arcsecToPx(stair.level, dist, ppm)} target={target.current} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className={slab} onClick={() => respond('top')}>
              Top
            </button>
            <button type="button" className={slab} onClick={() => respond('bottom')}>
              Bottom
            </button>
          </div>
          <p className="mt-2 min-h-6 text-ink-soft" aria-live="polite">
            {feedback}
          </p>
        </section>
      )}

      {stage === 'result' && ppm && dist && <Result stair={stair} ppm={ppm} dist={dist} onAgain={() => setStage('distance')} />}

      <div className="mt-12">
        <FeedbackCard context="acuity" />
      </div>
    </main>
  )
}

/** Close the right eye, fix the left eye on the square; the dot walks left and vanishes in the blind spot (~13.5° temporal). */
function BlindSpot({ ppm, onVanished }: { ppm: number; onVanished: (separationPx: number) => void }) {
  const [x, setX] = useState(0)
  const [running, setRunning] = useState(false)
  const frame = useRef<HTMLDivElement>(null)
  const start = useRef(0)
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setX((v) => v + 2), 16)
    return () => clearInterval(t)
  }, [running])
  const width = frame.current?.clientWidth ?? 600
  const fixX = width - 24
  const dotX = fixX - 60 - x
  const stop = () => {
    setRunning(false)
    onVanished(fixX - dotX)
  }
  return (
    <section className="mt-12">
      <h2 className="font-display text-title">2 · Find your blind spot</h2>
      <p className="mt-2 text-ink-soft">
        Sit as you will sit for the test. Cover your right eye. With the left eye look only at the square on the right. Press
        Start: the dot walks left. The moment it vanishes, press Gone. (It vanishes about 13.5° from where you look, which
        tells the page how far away you are.)
      </p>
      <div ref={frame} data-testid="blindspot" className="relative mt-4 h-24 rounded-md bg-paper-2">
        <div className="absolute top-1/2 size-5 -translate-y-1/2 bg-ink" style={{ left: fixX - 10 }} aria-hidden="true" />
        {running && dotX > 10 && <div className="absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-ink" style={{ left: dotX - 10 }} aria-hidden="true" />}
      </div>
      <div className="mt-3 flex gap-2">
        {!running ? (
          <button type="button" className={slab} onClick={() => { start.current = Date.now(); setX(0); setRunning(true) }}>
            Start
          </button>
        ) : (
          <button type="button" className={slab} onClick={stop} data-testid="gone">
            Gone
          </button>
        )}
        <button type="button" className={btn} onClick={() => onVanished(Math.round(500 * ppm * Math.tan((13.5 * Math.PI) / 180)))}>
          Skip, assume 50 cm
        </button>
      </div>
    </section>
  )
}

/** Two random-dot panels for free fusion, centres about 62 mm apart; the target region in the right panel is shifted left by shiftPx (crossed disparity: nearer). */
function StereoPair({ seed, ppm, shiftPx, target }: { seed: number; ppm: number; shiftPx: number; target: 'top' | 'bottom' }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const panel = Math.round(Math.min(48 * ppm, 220))
  const gap = Math.round(Math.max(8, 62 * ppm - panel))
  const W = panel * 2 + gap
  const H = panel
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    c.width = Math.round(W * dpr)
    c.height = Math.round(H * dpr)
    const ctx = c.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#f4f1ea'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#1c1a17'
    const rnd = mulberry32(seed)
    const n = Math.round(panel * panel * 0.08)
    const inTarget = (x: number, y: number) => x > panel * 0.25 && x < panel * 0.75 && (target === 'top' ? y > panel * 0.08 && y < panel * 0.46 : y > panel * 0.54 && y < panel * 0.92)
    for (let i = 0; i < n; i++) {
      const x = rnd() * panel
      const y = rnd() * panel
      const r = 1.1
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      const shift = inTarget(x, y) ? shiftPx : 0
      ctx.beginPath()
      ctx.arc(panel + gap + x - shift, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    // fusion marks
    ctx.fillStyle = '#0f5a63'
    for (const cx of [panel / 2, panel + gap + panel / 2]) {
      ctx.beginPath()
      ctx.arc(cx, 6, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [seed, ppm, shiftPx, target, W, H, panel, gap])
  return <canvas ref={ref} data-testid="stereo-pair" className="mt-4 block rounded-md" style={{ width: W, height: H }} aria-label="Two random-dot panels to fuse" />
}

function Result({ stair, ppm, dist, onAgain }: { stair: Staircase; ppm: number; dist: number; onAgain: () => void }) {
  const t = threshold(stair)
  const f = floors(dist, ppm)
  const [lo, hi] = t ? band(t) : [0, 0]
  return (
    <section className="mt-12" data-testid="acuity-result">
      <h2 className="font-display text-title">4 · The result, with its limits</h2>
      {t ? (
        <>
          <p className="mt-4 font-display text-display">about {Math.round(Math.max(t, f.subpixelArcsec))}″</p>
          <p className="mt-2">
            On this screen, {Math.round(dist / 10)} cm from your eyes, you told the squares apart at about {Math.round(t)} arcseconds of
            disparity after {stair.trials} trials. The honest band is {Math.round(lo)}–{Math.round(hi)}″: the best browser test
            published (ASTEROID, 2019) finds a factor of 4.3 between two sittings of the same person.
          </p>
          <p className="mt-2">
            The floor: one pixel here is {Math.round(f.pixelArcsec)}″, and drawing dots between pixels lets the page claim at best about{' '}
            {Math.round(f.subpixelArcsec)}″. Anything finer than that is "{Math.round(f.subpixelArcsec)}″ or better", not a number.
            Clinical cards measure down to 20″; this page cannot.
          </p>
        </>
      ) : (
        <p className="mt-4">Not enough reversals to say. That happens; try again sitting still.</p>
      )}
      <p className="mt-2 text-ink-soft">
        About one adult in fourteen cannot fuse random-dot pairs at all (Chopin, Bavelier and Levi, 2019). If the squares never stood out,
        that is a result, not a failure of effort, and an orthoptist can say why. Nothing here is stored or shared.
      </p>
      <div className="mt-4 flex gap-2">
        <button type="button" className={btn} onClick={onAgain}>
          Measure again
        </button>
        <a href="#/see" className={`${btn} flex items-center`}>
          Back to how to see
        </a>
      </div>
    </section>
  )
}
