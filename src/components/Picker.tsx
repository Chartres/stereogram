import { useEffect, useRef, type ReactNode } from 'react'

export interface PickerItem {
  id: string
  label: string
  thumb: ReactNode
}

/** A horizontal strip of thumbnails that snap (mobile-ux "magnetic paging"): you see what you pick.
 * Touch swipes it; a mouse gets arrows at the ends (6 Nov: "on the desktop there is no way to scroll"). */
export function Picker({ label, items, value, onChange }: { label: string; items: PickerItem[]; value: string; onChange: (id: string) => void }) {
  const strip = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // scroll the strip only: scrollIntoView would also scroll the page down to the strip on load
    const s = strip.current
    const el = s?.querySelector<HTMLElement>('[aria-checked="true"]')
    if (!s || !el) return
    const left = el.offsetLeft - s.offsetLeft
    if (left < s.scrollLeft || left + el.offsetWidth > s.scrollLeft + s.clientWidth) s.scrollLeft = Math.max(0, left - 40)
  }, [value])
  const page = (dir: -1 | 1) => strip.current?.scrollBy({ left: dir * strip.current.clientWidth * 0.8, behavior: 'smooth' })
  const arrow = 'absolute top-0 z-[1] hidden h-20 w-10 items-center justify-center bg-paper/85 text-ink shadow-sm [@media(pointer:fine)]:flex'
  return (
    <div>
      <span className="text-label uppercase tracking-wide text-ink-soft">{label}</span>
      <div className="relative mt-1">
        <button type="button" aria-label={`Scroll ${label} left`} onClick={() => page(-1)} className={`${arrow} left-0 rounded-r-md`}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button type="button" aria-label={`Scroll ${label} right`} onClick={() => page(1)} className={`${arrow} right-0 rounded-l-md`}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div
          ref={strip}
          role="radiogroup"
          aria-label={label}
          className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [@media(pointer:fine)]:mx-0 [@media(pointer:fine)]:px-10"
          style={{ overscrollBehaviorX: 'contain' }}
        >
          {items.map((it) => {
            const on = it.id === value
            return (
              <button
                key={it.id}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={it.label}
                data-id={it.id}
                onClick={() => onChange(it.id)}
                className="w-24 shrink-0 snap-start text-left"
              >
                <div className={`h-20 w-24 overflow-hidden rounded-md bg-paper-2 ${on ? 'ring-[3px] ring-accent' : ''}`}>{it.thumb}</div>
                <span className={`mt-1 block truncate text-label ${on ? 'text-ink' : 'text-ink-soft'}`}>{it.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** A small canvas painted once from RGBA pixels (shape and tile thumbnails). */
export function PixelThumb({ pixels }: { pixels: { width: number; height: number; data: Uint8ClampedArray } }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    c.width = pixels.width
    c.height = pixels.height
    c.getContext('2d')!.putImageData(new ImageData(pixels.data as Uint8ClampedArray<ArrayBuffer>, pixels.width, pixels.height), 0, 0)
  }, [pixels])
  return <canvas ref={ref} className="h-full w-full" aria-hidden="true" />
}
