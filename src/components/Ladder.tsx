import { useEffect, useRef, useState } from 'react'
import { conversion, track } from '@/analytics'
import { DEFAULT_PARAMS, type Params } from '@/domain/params'
import { FEATURED_FIRST, PATTERNS } from '@/library'
import { StereogramView } from './StereogramView'

// The patient eye: six rungs from shallow and wide to the default, staged like the orthoptists'
// cat → bucket → ABC/123 sequence, with a relax step between. The viewer marks "seen it" themself
// (Montessori: control of error, no verification). Progress stays on the device.
const KEY = 'ladder:seen'

interface Rung {
  title: string
  hint: string
  params: Partial<Params>
}

function rungs(): Rung[] {
  const fig = FEATURED_FIRST[0]
  const pat = PATTERNS[0]
  return [
    { title: '1 · A shallow ball', hint: 'Wide strips, little depth. Look through the page until the two dots become three.', params: { scene: { kind: 'shape', shape: 'sphere' }, depth: 0.12, eyeSeparation: 200 } },
    { title: '2 · A block of stairs', hint: 'Flat steps are easier to lock onto than curves. Hold the middle dot steady.', params: { scene: { kind: 'shape', shape: 'stairs' }, depth: 0.18, eyeSeparation: 190 } },
    { title: '3 · Letters', hint: 'Large letters, like the orthoptists’ ABC card. Read them once they rise.', params: { scene: { kind: 'text', text: 'ABC' }, depth: 0.25, eyeSeparation: 180 } },
    { title: '4 · The default', hint: 'Eye separation 180 px, depth of field one third: the 1994 paper’s own numbers.', params: { scene: { kind: 'shape', shape: 'sphere' }, depth: 1 / 3, eyeSeparation: 180 } },
    { title: '5 · A plate from the book', hint: fig && pat ? `${fig.title} hidden in ornament from The Met.` : 'A sculpture hidden in ornament.', params: fig && pat ? { scene: { kind: 'figure', id: fig.id }, pattern: `lib:${pat.id}`, depth: 1 / 3 } : { scene: { kind: 'shape', shape: 'torus' }, depth: 1 / 3 } },
    { title: '6 · Deep and narrow', hint: 'The hardest rung: narrow strips, deep relief, colour.', params: { scene: { kind: 'shape', shape: 'torus' }, pattern: 'color', depth: 0.45, eyeSeparation: 140 } },
  ]
}

function readSeen(): number {
  try {
    return Number(localStorage.getItem(KEY) || 0)
  } catch {
    return 0
  }
}

export function Ladder() {
  const steps = rungs()
  const [seen, setSeen] = useState(readSeen)
  const [shimmer, setShimmer] = useState(false)
  const frame = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)

  useEffect(() => {
    const el = frame.current
    if (!el) return
    const apply = () => setWidth(Math.max(64, el.clientWidth))
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const current = Math.min(seen, steps.length - 1)

  function markSeen(i: number) {
    const next = i + 1
    setSeen(next)
    try {
      localStorage.setItem(KEY, String(next))
    } catch {
      /* private mode */
    }
    track('key_action', { action: 'ladder_step', step: next })
    if (next === steps.length) conversion('ladder')
  }

  return (
    <section aria-label="The patient eye" ref={frame} className="mt-12">
      <h2 className="font-display text-title">The patient eye: six rungs</h2>
      <p className="mt-2 text-ink-soft">
        Wheatstone wrote in 1838 that this "requires practice". Orthoptists still teach it in stages. Take the rungs in order,
        rest your eyes between them, and mark each one yourself. Nothing is checked.
      </p>
      <label className="mt-3 flex min-h-11 items-center gap-3">
        <input type="checkbox" className="size-6" checked={shimmer} onChange={(e) => { setShimmer(e.target.checked); track('key_action', { action: 'shimmer', on: e.target.checked }) }} />
        <span>Shimmer the dots (a screen-only aid the 1994 authors proposed)</span>
      </label>

      <ol className="mt-6 space-y-12">
        {steps.map((r, i) => {
          const unlocked = i <= current
          const done = i < seen
          const params: Params = { ...DEFAULT_PARAMS, ...r.params, width, height: Math.round(width * (width < 600 ? 0.8 : 0.55)), helpers: true }
          return (
            <li key={r.title} data-testid={`rung-${i + 1}`} data-state={done ? 'seen' : unlocked ? 'open' : 'locked'}>
              <h3 className="font-display text-title">{r.title}</h3>
              <p className="mt-1 text-ink-soft">{r.hint}</p>
              {unlocked ? (
                <div className="mt-3">
                  <StereogramView
                    params={params}
                    shimmer={shimmer && i === current}
                    testId={`ladder-${i + 1}`}
                    label={`Rung ${i + 1}: ${r.title}`}
                  />
                  {done ? (
                    <p className="mt-2 text-label uppercase tracking-wide text-accent">Seen</p>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => markSeen(i)} className="min-h-12 rounded-md bg-accent px-5 font-display text-title text-paper">
                        I saw it
                      </button>
                      <span className="text-ink-soft">Then close your eyes for ten seconds before the next rung.</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-label uppercase tracking-wide text-ink-soft">After rung {i}</p>
              )}
            </li>
          )
        })}
      </ol>

      {seen >= steps.length ? (
        <p className="mt-12">All six. From here the Make page and the book are yours.</p>
      ) : (
        <p className="mt-12 text-ink-soft">
          If nothing comes after six rungs on different days, that is a real result and not a failure of effort: about one adult
          in fourteen cannot fuse these pictures. An orthoptist can say why; this page cannot.
        </p>
      )}
    </section>
  )
}
