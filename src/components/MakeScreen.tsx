import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { conversion, track } from '@/analytics'
import { createRenderer } from '@/app/renderer'
import { canvasToBlob, fileToRgba, fileToTile, textDepth } from '@/app/sources'
import { blurDepth, depthFromRgba, depthToRgba, flatDepth, resampleDepth, SHAPE_LABELS, SHAPES, shapeDepth, type DepthMap, type Rgba } from '@/domain/depth'
import { DEFAULT_PARAMS, decodeParams, encodeParams, isShareable, LIMITS, SIZE_PRESETS, type Params, type PatternChoice } from '@/domain/params'
import { proceduralTile, TILE_LABELS, TILES } from '@/domain/pattern'
import { helperDots, type PatternSpec } from '@/domain/stereogram'
import { randomSeed } from '@/domain/prng'
import { DepthPainter } from './DepthPainter'
import { FeedbackCard } from './FeedbackCard'

const field = 'mt-1 block w-full min-h-11 rounded-md bg-paper-2 px-3 py-2'
const label = 'text-label uppercase tracking-wide text-ink-soft'
const seg = (on: boolean) => `min-h-11 flex-1 rounded-md px-3 ${on ? 'bg-ink text-paper' : 'bg-paper-2 text-ink'}`

function screenSize(cw: number): { width: number; height: number } {
  const width = Math.max(LIMITS.width[0], Math.min(LIMITS.width[1], Math.round(cw)))
  return { width, height: Math.round(width * (width < 600 ? 0.9 : 0.6)) }
}

export function MakeScreen() {
  const [params, setParams] = useState<Params>(() => decodeParams(location.search))
  const [presetId, setPresetId] = useState(() => (new URLSearchParams(location.search).has('w') ? 'custom' : 'screen'))
  const [imageFile, setImageFile] = useState<Blob | null>(null)
  const [imageRgba, setImageRgba] = useState<Rgba | null>(null)
  const [drawDepth, setDrawDepth] = useState<DepthMap | null>(null)
  const [tileRgba, setTileRgba] = useState<Rgba | null>(null)
  const [reveal, setReveal] = useState(false)
  const [renders, setRenders] = useState(0)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const frame = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const renderer = useMemo(createRenderer, [])
  useEffect(() => () => renderer.dispose(), [renderer])

  const set = useCallback(<K extends keyof Params>(key: K, value: Params[K]) => setParams((p) => ({ ...p, [key]: value })), [])

  // "This screen": the picture is exactly the width you see, 1:1 CSS pixels.
  useEffect(() => {
    if (presetId !== 'screen' || !frame.current) return
    const el = frame.current
    const apply = () => {
      const { width, height } = screenSize(el.clientWidth)
      setParams((p) => (p.width === width && p.height === height ? p : { ...p, width, height, eyeSeparation: 180 }))
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [presetId])

  // uploaded depth picture, refitted whenever the output size changes
  useEffect(() => {
    if (!imageFile) return setImageRgba(null)
    let live = true
    fileToRgba(imageFile, params.width, params.height).then((r) => live && setImageRgba(r))
    return () => {
      live = false
    }
  }, [imageFile, params.width, params.height])

  // shareable settings live in the URL, so reload and copy-link both reproduce the picture
  useEffect(() => {
    if (!isShareable(params)) return
    history.replaceState(null, '', `?${encodeParams(params)}${location.hash}`)
  }, [params])

  const depth = useMemo<DepthMap>(() => {
    const { width, height, scene, smooth, invert } = params
    switch (scene.kind) {
      case 'shape':
        return shapeDepth(scene.shape, width, height)
      case 'text':
        return blurDepth(textDepth(scene.text, width, height), smooth)
      case 'image':
        return imageRgba ? depthFromRgba(imageRgba, { invert, smooth }) : flatDepth(width, height)
      case 'draw':
        return drawDepth ? blurDepth(resampleDepth(drawDepth, width, height), smooth) : flatDepth(width, height)
    }
  }, [params, imageRgba, drawDepth])

  const pattern = useMemo<PatternSpec>(() => {
    const p = params.pattern
    if (p === 'dots') return { kind: 'dots', density: params.density }
    if (p === 'color') return { kind: 'color' }
    if (p === 'image') return tileRgba ? { kind: 'tile', tile: tileRgba } : { kind: 'dots', density: params.density }
    return { kind: 'tile', tile: proceduralTile(p, 128, params.seed) }
  }, [params.pattern, params.density, params.seed, tileRgba])

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    setBusy(true)
    const t = setTimeout(async () => {
      const img = reveal
        ? depthToRgba(depth)
        : await renderer.render(depth, {
            eyeSeparation: params.eyeSeparation,
            depthOfField: params.depth,
            mode: params.mode,
            hiddenSurface: params.hiddenSurface,
            seed: params.seed,
            pattern,
          })
      if (!canvas.current) return
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')!
      ctx.putImageData(new ImageData(img.data as Uint8ClampedArray<ArrayBuffer>, img.width, img.height), 0, 0)
      if (params.helpers && !reveal) {
        const { left, right } = helperDots(img.width, params.eyeSeparation, params.depth)
        const r = Math.max(5, Math.round(img.width / 120))
        for (const x of [left, right]) {
          ctx.beginPath()
          ctx.arc(x, r * 3, r, 0, Math.PI * 2)
          ctx.fillStyle = '#0f5a63'
          ctx.fill()
          ctx.lineWidth = Math.max(1, r / 3)
          ctx.strokeStyle = '#f4f1ea'
          ctx.stroke()
        }
      }
      setBusy(false)
      setRenders((n) => n + 1)
    }, 40)
    return () => clearTimeout(t)
  }, [depth, pattern, params.eyeSeparation, params.depth, params.mode, params.hiddenSurface, params.seed, params.helpers, reveal, renderer])

  const sceneName = params.scene.kind === 'shape' ? params.scene.shape : params.scene.kind
  const fileName = `stereogram-${sceneName}-${params.seed}.png`

  async function download() {
    if (!canvas.current) return
    const blob = await canvasToBlob(canvas.current)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = fileName
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
    track('key_action', { action: 'download', scene: sceneName, pattern: params.pattern, w: params.width, h: params.height })
    conversion('download')
    flash('Saved as ' + fileName)
  }

  async function copyImage() {
    if (!canvas.current) return
    try {
      const blob = await canvasToBlob(canvas.current)
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      track('key_action', { action: 'copy_image' })
      conversion('copy')
      flash('Picture copied')
    } catch {
      flash('Your browser cannot copy pictures. Download instead.')
    }
  }

  async function copyLink() {
    const url = `${location.origin}/?${encodeParams(params)}`
    try {
      await navigator.clipboard.writeText(url)
      track('key_action', { action: 'share_link', scene: sceneName })
      flash('Link copied')
    } catch {
      flash(url)
    }
  }

  function flash(msg: string) {
    setNote(msg)
    setTimeout(() => setNote(null), 4000)
  }

  function choosePreset(id: string) {
    setPresetId(id)
    const p = SIZE_PRESETS.find((s) => s.id === id)
    if (p && p.width) setParams((x) => ({ ...x, width: p.width, height: p.height, eyeSeparation: p.eyeSeparation }))
    track('key_action', { action: 'preset', preset: id })
  }

  const shownAt = frame.current && canvas.current ? Math.min(100, Math.round((frame.current.clientWidth / params.width) * 100)) : 100
  const sceneKind = params.scene.kind
  const needsSmooth = sceneKind !== 'shape'

  return (
    <main className="mx-auto max-w-5xl px-4 pb-28 pt-3">
      <header className="flex items-baseline justify-between">
        <h1 className="font-display text-title">Stereogram</h1>
        <FeedbackCard context="make" />
      </header>

      <div ref={frame} className="mt-3">
        <canvas
          ref={canvas}
          data-testid="stereogram"
          data-renders={renders}
          data-busy={busy ? '1' : '0'}
          role="img"
          aria-label={`Stereogram of ${sceneName}. Relax your eyes to see it in depth.`}
          className="block w-full rounded-md bg-paper-2"
          style={{ aspectRatio: `${params.width} / ${params.height}` }}
        />
      </div>
      <p className="mt-2 text-label uppercase tracking-wide text-ink-soft" aria-live="polite">
        {note ?? (busy ? 'Rendering…' : shownAt < 100 ? `${params.width} × ${params.height} px, shown at ${shownAt} %. The download is full size.` : `${params.width} × ${params.height} px`)}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={download} className="min-h-12 flex-1 rounded-md bg-accent px-5 font-display text-title text-paper">
          Download PNG
        </button>
        <button type="button" onClick={copyImage} className="min-h-12 rounded-md border border-edge px-4">
          Copy picture
        </button>
        <button type="button" onClick={copyLink} disabled={!isShareable(params)} title={isShareable(params) ? undefined : 'Drawings and uploads cannot travel in a link'} className="min-h-12 rounded-md border border-edge px-4 disabled:opacity-50">
          Copy link
        </button>
        <button type="button" onClick={() => set('seed', randomSeed())} className="min-h-12 rounded-md border border-edge px-4">
          Shuffle
        </button>
      </div>

      <section aria-label="Scene" className="mt-12">
        <h2 className={label}>Scene</h2>
        <div className="mt-1 flex gap-2" role="group" aria-label="Scene type">
          <button type="button" aria-pressed={sceneKind === 'shape'} className={seg(sceneKind === 'shape')} onClick={() => set('scene', { kind: 'shape', shape: 'sphere' })}>Shape</button>
          <button type="button" aria-pressed={sceneKind === 'text'} className={seg(sceneKind === 'text')} onClick={() => set('scene', { kind: 'text', text: 'HELLO' })}>Text</button>
          <button type="button" aria-pressed={sceneKind === 'draw'} className={seg(sceneKind === 'draw')} onClick={() => set('scene', { kind: 'draw' })}>Draw</button>
          <button type="button" aria-pressed={sceneKind === 'image'} className={seg(sceneKind === 'image')} onClick={() => set('scene', { kind: 'image' })}>Picture</button>
        </div>

        {params.scene.kind === 'shape' && (
          <label className="mt-6 block">
            <span className={label}>Shape</span>
            <select className={field} value={params.scene.shape} onChange={(e) => set('scene', { kind: 'shape', shape: e.target.value as (typeof SHAPES)[number] })}>
              {SHAPES.map((s) => (
                <option key={s} value={s}>{SHAPE_LABELS[s]}</option>
              ))}
            </select>
          </label>
        )}
        {params.scene.kind === 'text' && (
          <label className="mt-6 block">
            <span className={label}>Hidden text</span>
            <input type="text" className={field} maxLength={LIMITS.text} value={params.scene.text} onChange={(e) => set('scene', { kind: 'text', text: e.target.value })} placeholder="A word or two" />
          </label>
        )}
        {params.scene.kind === 'draw' && (
          <div className="mt-6">
            <p className={label}>Paint the depth: white is near, black is far</p>
            <div className="mt-1">
              <DepthPainter aspect={params.width / params.height} onChange={setDrawDepth} />
            </div>
          </div>
        )}
        {params.scene.kind === 'image' && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Depth map (white near, black far)</span>
              <input type="file" accept="image/*" data-testid="depth-file" className={field} onChange={(e) => { setImageFile(e.target.files?.[0] ?? null); track('key_action', { action: 'upload_depth' }) }} />
            </label>
            <label className="flex min-h-11 items-center gap-3 sm:mt-6">
              <input type="checkbox" className="size-6" checked={params.invert} onChange={(e) => set('invert', e.target.checked)} />
              <span>Invert (black is near)</span>
            </label>
          </div>
        )}
        {needsSmooth && (
          <label className="mt-6 block">
            <span className={label}>Smooth edges {params.smooth}px</span>
            <input type="range" min={LIMITS.smooth[0]} max={LIMITS.smooth[1]} value={params.smooth} onChange={(e) => set('smooth', Number(e.target.value))} />
          </label>
        )}
      </section>

      <section aria-label="Pattern" className="mt-12 grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Pattern</span>
          <select className={field} value={params.pattern} onChange={(e) => set('pattern', e.target.value as PatternChoice)}>
            <option value="dots">Random dots</option>
            <option value="color">Random colour dots</option>
            {TILES.map((t) => (
              <option key={t} value={t}>{TILE_LABELS[t]}</option>
            ))}
            <option value="image">Your own picture</option>
          </select>
        </label>
        {params.pattern === 'dots' && (
          <label className="block">
            <span className={label}>Dot density {Math.round(params.density * 100)}%</span>
            <input type="range" min={LIMITS.density[0]} max={LIMITS.density[1]} step={0.05} value={params.density} onChange={(e) => set('density', Number(e.target.value))} />
          </label>
        )}
        {params.pattern === 'image' && (
          <label className="block">
            <span className={label}>Pattern picture (tiles across)</span>
            <input type="file" accept="image/*" data-testid="tile-file" className={field} onChange={async (e) => { const f = e.target.files?.[0]; setTileRgba(f ? await fileToTile(f) : null); track('key_action', { action: 'upload_tile' }) }} />
          </label>
        )}
      </section>

      <section aria-label="Depth and viewing" className="mt-12 grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Depth {Math.round(params.depth * 100)}%</span>
          <input type="range" min={LIMITS.depth[0]} max={LIMITS.depth[1]} step={0.01} value={params.depth} onChange={(e) => set('depth', Number(e.target.value))} />
        </label>
        <label className="block">
          <span className={label}>Eye separation {params.eyeSeparation}px</span>
          <input type="range" min={LIMITS.eyeSeparation[0]} max={Math.min(LIMITS.eyeSeparation[1], Math.floor(params.width / 2))} value={params.eyeSeparation} onChange={(e) => set('eyeSeparation', Number(e.target.value))} />
        </label>
        <div>
          <span className={label}>Viewing</span>
          <div className="mt-1 flex gap-2" role="group" aria-label="Viewing mode">
            <button type="button" aria-pressed={params.mode === 'parallel'} className={seg(params.mode === 'parallel')} onClick={() => set('mode', 'parallel')}>Parallel</button>
            <button type="button" aria-pressed={params.mode === 'cross'} className={seg(params.mode === 'cross')} onClick={() => set('mode', 'cross')}>Cross-eyed</button>
          </div>
        </div>
        <label className="block">
          <span className={label}>Seed</span>
          <input type="number" className={field} min={LIMITS.seed[0]} max={LIMITS.seed[1]} value={params.seed} onChange={(e) => set('seed', Math.max(0, Math.min(LIMITS.seed[1], Math.round(Number(e.target.value) || 0))))} />
        </label>
      </section>

      <section aria-label="Size" className="mt-12 grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Size</span>
          <select className={field} value={presetId} onChange={(e) => choosePreset(e.target.value)}>
            {SIZE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </label>
        {presetId === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={label}>Width</span>
              <input type="number" className={field} min={LIMITS.width[0]} max={LIMITS.width[1]} value={params.width} onChange={(e) => set('width', Math.max(LIMITS.width[0], Math.min(LIMITS.width[1], Math.round(Number(e.target.value) || LIMITS.width[0]))))} />
            </label>
            <label className="block">
              <span className={label}>Height</span>
              <input type="number" className={field} min={LIMITS.height[0]} max={LIMITS.height[1]} value={params.height} onChange={(e) => set('height', Math.max(LIMITS.height[0], Math.min(LIMITS.height[1], Math.round(Number(e.target.value) || LIMITS.height[0]))))} />
            </label>
          </div>
        )}
      </section>

      <section aria-label="Options" className="mt-12 grid gap-3 sm:grid-cols-3">
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" className="size-6" checked={params.helpers} onChange={(e) => set('helpers', e.target.checked)} />
          <span>Helper dots</span>
        </label>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" className="size-6" checked={params.hiddenSurface} onChange={(e) => set('hiddenSurface', e.target.checked)} />
          <span>Hidden-surface removal</span>
        </label>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" className="size-6" checked={reveal} onChange={(e) => { setReveal(e.target.checked); track('key_action', { action: 'reveal', on: e.target.checked }) }} />
          <span>Show the depth map</span>
        </label>
      </section>

      <p className="mt-12 text-ink-soft">
        Everything happens in your browser. Nothing is uploaded, nothing is stored, and the page works offline.
        New here? Read <a className="text-accent underline underline-offset-4" href="#/see">how to see it</a>.
        Defaults follow Thimbleby, Inglis and Witten (1994): eye separation {DEFAULT_PARAMS.eyeSeparation} px, depth of field ⅓.
      </p>
    </main>
  )
}
