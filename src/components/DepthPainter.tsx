import { useEffect, useRef, useState } from 'react'
import { depthFromRgba, type DepthMap } from '@/domain/depth'

const W = 480

/** Paint a depth map with a soft brush: white is near, black is far. Emits a DepthMap on every stroke. */
export function DepthPainter({ aspect, onChange }: { aspect: number; onChange: (d: DepthMap) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [radius, setRadius] = useState(40)
  const [height, setHeight] = useState(1)
  const drawing = useRef(false)
  const H = Math.max(80, Math.round(W / aspect))

  const emit = () => {
    const ctx = ref.current?.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    const img = ctx.getImageData(0, 0, W, H)
    onChange(depthFromRgba({ width: img.width, height: img.height, data: img.data }))
  }

  const clear = () => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)
    emit()
  }

  // ponytail: the drawing is cleared when the aspect changes (a resize of the page); keep strokes if it matters
  useEffect(clear, [H]) // eslint-disable-line react-hooks/exhaustive-deps

  const dab = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    const r = c.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * W
    const y = ((e.clientY - r.top) / r.height) * H
    const v = Math.round(height * 255)
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
    g.addColorStop(0, `rgba(${v},${v},${v},1)`)
    g.addColorStop(0.6, `rgba(${v},${v},${v},0.6)`)
    g.addColorStop(1, `rgba(${v},${v},${v},0)`)
    ctx.fillStyle = g
    ctx.globalCompositeOperation = height === 0 ? 'destination-out' : 'lighten'
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
    if (height === 0) {
      // erasing leaves transparency; refill black so the map stays opaque
      ctx.globalCompositeOperation = 'destination-over'
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  return (
    <div>
      <canvas
        ref={ref}
        width={W}
        height={H}
        data-testid="painter"
        aria-label="Depth drawing: white is near, black is far"
        className="w-full touch-none rounded-md bg-black"
        onPointerDown={(e) => {
          drawing.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          dab(e)
        }}
        onPointerMove={(e) => drawing.current && dab(e)}
        onPointerUp={() => {
          drawing.current = false
          emit()
        }}
        onPointerCancel={() => (drawing.current = false)}
      />
      <div className="mt-3 grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-label uppercase tracking-wide text-ink-soft">Brush {radius}px</span>
          <input type="range" min={8} max={120} value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
        </label>
        <label className="block">
          <span className="text-label uppercase tracking-wide text-ink-soft">Height {Math.round(height * 100)}%</span>
          <input type="range" min={0} max={1} step={0.05} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
        </label>
      </div>
      <button type="button" onClick={clear} className="mt-2 min-h-11 rounded-md border border-edge px-4">
        Clear drawing
      </button>
    </div>
  )
}
