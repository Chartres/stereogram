import { useEffect, useRef, useState } from 'react'
import { track } from '@/analytics'
import { encodeParams } from '@/domain/params'
import { figureById, patternById } from '@/library'
import { plateParams, plates } from '@/book/plates'
import { FeedbackCard } from './FeedbackCard'
import { PrintPlate } from './PrintPlate'
import { StereogramView } from './StereogramView'


const icon = 'flex min-h-12 min-w-12 flex-1 items-center justify-center rounded-md border border-edge sm:flex-none'
const Svg = ({ d, title }: { d: string; title: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><title>{title}</title><path d={d} /></svg>
)

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
  const [printSrc, setPrintSrc] = useState<string | null>(null)

  useEffect(() => {
    const el = frame.current
    if (!el) return
    const apply = () => {
      const w = Math.max(64, Math.min(4096, el.clientWidth))
      setSize({ width: w, height: Math.round(w * (w < 600 ? 1.1 : 0.6)) })
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
    // the system sheet where there is one (phones), else copy the link
    if (navigator.share) {
      try {
        await navigator.share({ title: `Stereogram, plate ${plate.n}`, text: 'Look through it until the two dots become three.', url })
        track('key_action', { action: 'plate_share', plate: plate.n, via: 'sheet' })
        return
      } catch (e) {
        if ((e as DOMException)?.name === 'AbortError') return
      }
    }
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
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-2">
      <header className="flex items-baseline justify-between">
        <h1 className="font-display text-title">
          Plate {plate.n} <span className="text-ink-soft">of {all.length}</span>
        </h1>
        <FeedbackCard context={`book/${plate.n}`} />
      </header>

      <div ref={frame} className="mt-2">
        <StereogramView params={params} reveal={answer} canvasRef={canvas} label={`Plate ${plate.n}: ${fig?.title ?? plate.figure} hidden in ${pat?.title ?? plate.pattern}`} />
      </div>

      <p className="mt-2 text-label uppercase tracking-wide text-ink-soft" aria-live="polite">
        {note ?? (answer ? `The answer: ${fig?.title ?? plate.figure}` : 'Find the angle. Look through the page, let the two dots become three, and wait.')}
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setAnswer((a) => !a)
            if (!answer) track('key_action', { action: 'plate_answer', plate: plate.n })
          }}
          className="min-h-12 basis-full whitespace-nowrap rounded-md bg-accent px-5 font-display text-title text-paper sm:basis-auto sm:flex-1"
        >
          {answer ? 'Hide the answer' : 'Show the answer'}
        </button>
        <a href={`#/book/${Math.max(1, plate.n - 1)}`} aria-label="Previous plate" className={`${icon} ${plate.n === 1 ? 'opacity-40' : ''}`}><Svg d="M15 5l-7 7 7 7" title="Previous plate" /></a>
        <a href={`#/book/${Math.min(all.length, plate.n + 1)}`} aria-label="Next plate" className={`${icon} ${plate.n === all.length ? 'opacity-40' : ''}`}><Svg d="M9 5l7 7-7 7" title="Next plate" /></a>
        <a href={makeHref} aria-label="Make your own" className={icon} onClick={() => track('key_action', { action: 'plate_make', plate: plate.n })}><Svg d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" title="Make your own" /></a>
        <button type="button" onClick={share} aria-label="Share this plate" className={icon}><Svg d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" title="Share this plate" /></button>
        <button
          type="button"
          aria-label="Print"
          onClick={() => {
            if (!canvas.current) return
            setPrintSrc(canvas.current.toDataURL('image/png'))
            track('key_action', { action: 'print_plate', plate: plate.n })
            setTimeout(() => window.print(), 150)
          }}
          className={icon}
        >
          <Svg d="M6 9V3h12v6M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v7H6z" title="Print" />
        </button>
      </div>
      <PrintPlate src={printSrc} params={params} title={`Plate ${plate.n}`} />

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


      <p className="mt-12 text-ink-soft">
        A book of plates in the tradition of the London Stereoscopic Company's card library of 1862 and the Magic Eye books: the
        figures are real sculptures released under CC0, the patterns are ornament from The Met's Open Access collection, and each
        plate names both. Salvador Dalí once used one of Béla Julesz's random-dot figures as a saint's halo; Julesz was not pleased.
      </p>
    </main>
  )
}
