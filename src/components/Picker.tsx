import { useEffect, useRef, type ReactNode } from 'react'

export interface PickerItem {
  id: string
  label: string
  thumb: ReactNode
}

/** A horizontal strip of thumbnails that snap (mobile-ux "magnetic paging"): you see what you pick. */
export function Picker({ label, items, value, onChange }: { label: string; items: PickerItem[]; value: string; onChange: (id: string) => void }) {
  const strip = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>('[aria-checked="true"]')
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [value])
  return (
    <div>
      <span className="text-label uppercase tracking-wide text-ink-soft">{label}</span>
      <div
        ref={strip}
        role="radiogroup"
        aria-label={label}
        className="mt-1 -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
