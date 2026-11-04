import { useEffect, useRef, useState } from 'react'
import { track } from '@/analytics'
import { DEFAULT_PARAMS, type Params } from '@/domain/params'
import { FIGURES, PATTERNS } from '@/library'
import { StereogramView } from './StereogramView'

// Comenius's spectacles (Labyrinth of the World, ch. IV, 1623): Delusion's glasses make near
// things look far and far things near. The same plate read parallel and then crossed does
// exactly that, and the viewer who did not know which way they were looking finds out here.
export function Spectacles() {
  const [mode, setMode] = useState<'parallel' | 'cross'>('parallel')
  const frame = useRef<HTMLElement>(null)
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
  const fig = FIGURES.find((f) => f.id === 'marble_bust_01') ?? FIGURES[0]
  const pat = PATTERNS[0]
  const params: Params = {
    ...DEFAULT_PARAMS,
    scene: fig ? { kind: 'figure', id: fig.id } : { kind: 'shape', shape: 'sphere' },
    pattern: pat ? `lib:${pat.id}` : 'dots',
    width,
    height: Math.round(width * (width < 600 ? 0.9 : 0.55)),
    mode,
    seed: 1623,
  }
  return (
    <section ref={frame} aria-label="Comenius's spectacles" className="mt-12">
      <h2 className="font-display text-title">Comenius's spectacles</h2>
      <p className="mt-2 text-ink-soft">
        In <em>The Labyrinth of the World</em> (1623) the pilgrim is given spectacles by Delusion, ground so that
        near things look far and far things near. This plate is the same trick. Look through the page and the
        figure stands out of it; cross your eyes and the same picture turns inside out, the figure sunk into the
        page like a mould. If a picture ever looked wrong, you were wearing the other pair.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Made for">
        {(['parallel', 'cross'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m)
              track('key_action', { action: 'spectacles_open', mode: m })
            }}
            className={`min-h-11 rounded-md px-2 ${mode === m ? 'bg-ink text-paper' : 'bg-paper-2 text-ink'}`}
          >
            {m === 'parallel' ? 'Made for looking through' : 'Made for crossed eyes'}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <StereogramView params={params} testId="spectacles" label="Comenius's spectacles plate" />
      </div>
      <p className="mt-2 text-label uppercase tracking-wide text-ink-soft">
        {fig ? `Figure: ${fig.credit}` : ''}{pat ? ` · Pattern: ${pat.credit}` : ''} · Comenius, Labyrint světa a ráj srdce, IV
      </p>
    </section>
  )
}
