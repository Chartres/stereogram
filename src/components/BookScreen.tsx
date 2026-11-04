import { useEffect, useRef, useState } from 'react'
import { track } from '@/analytics'
import { encodeParams } from '@/domain/params'
import { figureById, patternById } from '@/library'
import { plateParams, plates } from '@/book/plates'
import { FeedbackCard } from './FeedbackCard'
import { StereogramView } from './StereogramView'

const btn = 'min-h-11 rounded-md border border-edge px-4'

/** `#/book/<n>`: one plate per screen, with its provenance, an answer, and a way to make your own from it. */
export function BookScreen({ n }: { n: number }) {
  const all = plates()
  const idx = Math.min(all.length, Math.max(1, n))
  const plate = all[idx - 1]
  const frame = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ width: 960, height: 600 })
  const [answer, setAnswer] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    const el = frame.current
    if (!el) return
    const apply = () => {
      const w = Math.max(64, Math.min(4096, el.clientWidth))
      setSize({ width: w, height: Math.round(w * (w < 600 ? 0.9 : 0.6)) })
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    setAnswer(false)
    if (plate) track('key_action', { action: 'plate_open', plate: plate.n, figure: plate.figure, pattern: plate.pattern })
    window.scrollTo(0, 0)
  }, [plate?.n]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!plate) {
    return (
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-6">
        <h1 className="font-display text-display">The book</h1>
        <p className="mt-4 text-ink-soft">The library has not been baked yet (`node scripts/bake-library.mjs`).</p>
      </main>
    )
  }

  const params = plateParams(plate, size.width, size.height)
  const fig = figureById(plate.figure)
  const pat = patternById(plate.pattern)
  const makeHref = `/?${encodeParams(params)}`

  async function share() {
    const url = `${location.origin}/#/book/${plate.n}`
    try {
      await navigator.clipboard.writeText(url)
      setNote('Link copied. The picture is not in the link; only its recipe.')
    } catch {
      setNote(url)
    }
    track('key_action', { action: 'plate_share', plate: plate.n })
    setTimeout(() => setNote(null), 4000)
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-28 pt-3">
      <header className="flex items-baseline justify-between">
        <h1 className="font-display text-title">
          Plate {plate.n} <span className="text-ink-soft">of {all.length}</span>
        </h1>
        <FeedbackCard context={`book/${plate.n}`} />
      </header>

      <div ref={frame} className="mt-3">
        <StereogramView params={params} reveal={answer} canvasRef={canvas} label={`Plate ${plate.n}: ${fig?.title ?? plate.figure} hidden in ${pat?.title ?? plate.pattern}`} />
      </div>

      <p className="mt-2 text-label uppercase tracking-wide text-ink-soft" aria-live="polite">
        {note ?? (answer ? `The answer: ${fig?.title ?? plate.figure}` : 'Find the angle. Look through the page, let the two dots become three, and wait.')}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setAnswer((a) => !a)
            if (!answer) track('key_action', { action: 'plate_answer', plate: plate.n })
          }}
          className="min-h-12 flex-1 rounded-md bg-accent px-5 font-display text-title text-paper"
        >
          {answer ? 'Hide the answer' : 'Show the answer'}
        </button>
        <a href={makeHref} className={`${btn} flex items-center`} onClick={() => track('key_action', { action: 'plate_make', plate: plate.n })}>
          Make your own from this plate
        </a>
        <button type="button" onClick={share} className={btn}>
          Share this plate
        </button>
      </div>

      <section className="mt-6 text-ink-soft">
        <p>
          <span className="text-label uppercase tracking-wide">Figure</span> · {fig?.credit ?? plate.figure}
          {fig?.url && (
            <>
              {' '}
              <a className="text-accent underline underline-offset-4" href={fig.url} rel="noreferrer">source</a>
            </>
          )}
        </p>
        <p>
          <span className="text-label uppercase tracking-wide">Pattern</span> · {pat?.credit ?? plate.pattern}
          {pat?.url && (
            <>
              {' '}
              <a className="text-accent underline underline-offset-4" href={pat.url} rel="noreferrer">source</a>
            </>
          )}
        </p>
      </section>

      <nav aria-label="Plates" className="mt-6 flex gap-2">
        <a href={`#/book/${Math.max(1, plate.n - 1)}`} aria-disabled={plate.n === 1} className={`${btn} flex flex-1 items-center justify-center ${plate.n === 1 ? 'opacity-50' : ''}`}>
          Previous plate
        </a>
        <a href={`#/book/${Math.min(all.length, plate.n + 1)}`} aria-disabled={plate.n === all.length} className={`${btn} flex flex-1 items-center justify-center ${plate.n === all.length ? 'opacity-50' : ''}`}>
          Next plate
        </a>
      </nav>

      <p className="mt-12 text-ink-soft">
        A book of plates in the tradition of the London Stereoscopic Company's card library of 1862 and the Magic Eye books: the
        figures are real sculptures released under CC0, the patterns are ornament from The Met's Open Access collection, and each
        plate names both. Salvador Dalí once used one of Béla Julesz's random-dot figures as a saint's halo; Julesz was not pleased.
      </p>
    </main>
  )
}
