import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { conversion, track } from '@/analytics'
import { canvasToBlob, fileToRgba, fileToTile } from '@/app/sources'
import { depthToRgba, flatDepth, SHAPE_LABELS, SHAPES, shapeDepth, type DepthMap, type Rgba } from '@/domain/depth'
import { DEFAULT_PARAMS, decodeParams, encodeParams, isShareable, LIMITS, SIZE_PRESETS, type Params, type PatternChoice } from '@/domain/params'
import { proceduralTile, TILE_LABELS, TILES } from '@/domain/pattern'
import { randomSeed } from '@/domain/prng'
import { renderStereogram } from '@/domain/stereogram'
import { FEATURED_FIRST, FIGURES, PATTERNS, figureById, patternById } from '@/library'
import { DepthPainter } from './DepthPainter'
import { FeedbackCard } from './FeedbackCard'
import { Picker, PixelThumb, type PickerItem } from './Picker'
import { PrintPlate } from './PrintPlate'
import { StereogramView } from './StereogramView'

const field = 'mt-1 block w-full min-h-11 rounded-md bg-paper-2 px-3 py-2'
const label = 'text-label uppercase tracking-wide text-ink-soft'
const seg = (on: boolean) => `min-h-11 min-w-0 rounded-md px-1 text-[15px] ${on ? 'bg-ink text-paper' : 'bg-paper-2 text-ink'}`
const icon = 'flex min-h-12 min-w-12 flex-1 items-center justify-center rounded-md border border-edge sm:flex-none'

function screenSize(cw: number): { width: number; height: number } {
  const width = Math.max(LIMITS.width[0], Math.min(LIMITS.width[1], Math.round(cw)))
  return { width, height: Math.round(width * (width < 600 ? 1.1 : 0.6)) }
}

/** The credit line under a picture: who made the figure and the pattern, when the library did. */
export function provenanceLine(p: Params): string | null {
  const parts: string[] = []
  if (p.scene.kind === 'figure') parts.push(`Figure: ${figureById(p.scene.id)?.credit ?? p.scene.id}`)
  if (p.pattern.startsWith('lib:')) parts.push(`Pattern: ${patternById(p.pattern.slice(4))?.credit ?? p.pattern}`)
  return parts.length ? parts.join(' · ') : null
}

const Svg = ({ d, title }: { d: string; title: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <title>{title}</title>
    <path d={d} />
  </svg>
)
const ICONS = {
  copy: 'M8 8h12v12H8zM4 16V4h12',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  print: 'M6 9V3h12v6M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v7H6z',
  shuffle: 'M3 7h4l10 10h4M17 5l4 2-4 2M3 17h4l2-2M13 9l4-4h4M17 19l4-2-4-2',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  download: 'M12 3v12M7 10l5 5 5-5M4 19h16',
}

/** True where the system share sheet takes files (iOS, Android, some desktops): there it is the main action. */
export function canShareFiles(nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined): boolean {
  try {
    const probe = new File([new Uint8Array([0])], 'probe.png', { type: 'image/png' })
    return !!nav?.canShare?.({ files: [probe] })
  } catch {
    return false
  }
}

export function MakeScreen() {
  const [params, setParams] = useState<Params>(() => decodeParams(location.search))
  const [presetId, setPresetId] = useState(() => (new URLSearchParams(location.search).has('w') ? 'custom' : 'screen'))
  const [imageFile, setImageFile] = useState<Blob | null>(null)
  const [imageRgba, setImageRgba] = useState<Rgba | null>(null)
  const [drawDepth, setDrawDepth] = useState<DepthMap | null>(null)
  const [tileRgba, setTileRgba] = useState<Rgba | null>(null)
  const [reveal, setReveal] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [printSrc, setPrintSrc] = useState<string | null>(null)
  const [shareMain] = useState(() => canShareFiles())
  const prepared = useRef<Promise<Blob> | null>(null)
  const frame = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const tileFile = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (!imageFile) return setImageRgba(null)
    let live = true
    fileToRgba(imageFile, params.width, params.height).then((r) => live && setImageRgba(r))
    return () => {
      live = false
    }
  }, [imageFile, params.width, params.height])

  useEffect(() => {
    if (!isShareable(params)) return
    history.replaceState(null, '', `?${encodeParams(params)}${location.hash}`)
  }, [params])

  const sceneName = params.scene.kind === 'shape' ? params.scene.shape : params.scene.kind === 'figure' ? params.scene.id : params.scene.kind
  const fileName = `stereogram-${sceneName}-${params.seed}.png`

  function flash(msg: string) {
    setNote(msg)
    setTimeout(() => setNote(null), 4000)
  }
  // Share is the main action on phones. The PNG is prepared on pointer-down so the share call
  // stays inside Safari's user-activation window; a refusal falls back to the download.
  function prepare() {
    if (canvas.current) prepared.current = canvasToBlob(canvas.current)
  }
  async function sharePicture() {
    if (!canvas.current) return
    const blob = await (prepared.current ?? canvasToBlob(canvas.current))
    prepared.current = null
    const file = new File([blob], fileName, { type: 'image/png' })
    const link = isShareable(params) ? `${location.origin}/?${encodeParams(params)}` : location.origin
    const credit = provenanceLine(params)
    const text = `A stereogram${credit ? ` (${credit})` : ''}. Look through it until the two dots become three. ${link}`
    try {
      await navigator.share({ files: [file], title: 'Stereogram', text })
      track('key_action', { action: 'share', scene: sceneName, pattern: params.pattern })
      conversion('share')
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return // the person closed the sheet
      download()
    }
  }
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
  function printPlate() {
    if (!canvas.current) return
    setPrintSrc(canvas.current.toDataURL('image/png'))
    track('key_action', { action: 'print_plate', scene: sceneName })
    setTimeout(() => window.print(), 150)
  }
  function choosePreset(id: string) {
    setPresetId(id)
    const p = SIZE_PRESETS.find((s) => s.id === id)
    if (p && p.width) setParams((x) => ({ ...x, width: p.width, height: p.height, eyeSeparation: p.eyeSeparation }))
    track('key_action', { action: 'preset', preset: id })
  }

  // thumbnails: computed once; the strips show what you pick
  const shapeItems = useMemo<PickerItem[]>(() => SHAPES.map((s) => ({ id: s, label: SHAPE_LABELS[s], thumb: <PixelThumb pixels={depthToRgba(shapeDepth(s, 96, 80))} /> })), [])
  const figureItems = useMemo<PickerItem[]>(() => FEATURED_FIRST.map((f) => ({ id: f.id, label: f.title, thumb: <img src={f.file} alt="" loading="lazy" className="h-full w-full bg-black object-contain" /> })), [])
  const patternItems = useMemo<PickerItem[]>(() => {
    const flat = flatDepth(96, 80)
    const mini = (pattern: Parameters<typeof renderStereogram>[1]['pattern']) => <PixelThumb pixels={renderStereogram(flat, { eyeSeparation: 40, seed: 1994, pattern })} />
    return [
      { id: 'dots', label: 'Random dots', thumb: mini({ kind: 'dots', density: 0.5 }) },
      { id: 'color', label: 'Colour dots', thumb: mini({ kind: 'color' }) },
      ...TILES.map((t) => ({ id: t, label: TILE_LABELS[t], thumb: <PixelThumb pixels={proceduralTile(t, 96, 1994)} /> })),
      { id: 'image', label: 'Your picture', thumb: <div className="flex h-full items-center justify-center text-label uppercase tracking-wide text-ink-soft">upload</div> },
      ...PATTERNS.map((p) => ({ id: `lib:${p.id}`, label: `${p.title}${p.date ? `, ${p.date}` : ''}`, thumb: <img src={p.file} alt="" loading="lazy" className="h-full w-full object-cover" /> })),
    ]
  }, [])

  const shownAt = frame.current ? Math.min(100, Math.round((frame.current.clientWidth / params.width) * 100)) : 100
  const sceneKind = params.scene.kind
  const credit = provenanceLine(params)

  return (
    <main className="mx-auto max-w-5xl overflow-x-hidden px-4 pb-24 pt-2">
      <header className="flex items-baseline justify-between">
        <h1 className="font-display text-title">Stereogram</h1>
        <FeedbackCard context="make" />
      </header>

      <div ref={frame} className="mt-2">
        <StereogramView params={params} sources={{ imageRgba, drawDepth, tileRgba }} reveal={reveal} canvasRef={canvas} label={`Stereogram of ${sceneName}. Relax your eyes to see it in depth.`} />
      </div>
      <p className="mt-1 line-clamp-2 text-label uppercase tracking-wide text-ink-soft" aria-live="polite">
        {note ?? (shownAt < 100 ? `${params.width} × ${params.height} px, shown at ${shownAt} %` : `${params.width} × ${params.height} px`)}
        {credit ? ' · ' : ''}
        {credit && (
          <span data-testid="provenance" className="normal-case tracking-normal">
            {credit}
          </span>
        )}
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {shareMain ? (
          <>
            <button type="button" onPointerDown={prepare} onClick={sharePicture} className="min-h-12 min-w-0 basis-full whitespace-nowrap rounded-md bg-accent px-4 font-display text-title text-paper sm:basis-auto sm:flex-1">
              Share picture
            </button>
            <button type="button" onClick={download} className={icon} aria-label="Download PNG"><Svg d={ICONS.download} title="Download PNG" /></button>
          </>
        ) : (
          <>
            <button type="button" onClick={download} className="min-h-12 min-w-0 basis-full whitespace-nowrap rounded-md bg-accent px-4 font-display text-title text-paper sm:basis-auto sm:flex-1">
              Download PNG
            </button>
            <button type="button" onClick={copyImage} className={icon} aria-label="Copy picture"><Svg d={ICONS.copy} title="Copy picture" /></button>
          </>
        )}
        <button type="button" onClick={copyLink} disabled={!isShareable(params)} className={`${icon} disabled:opacity-40`} aria-label="Copy link"><Svg d={ICONS.link} title="Copy link" /></button>
        <button type="button" onClick={printPlate} className={icon} aria-label="Print plate"><Svg d={ICONS.print} title="Print plate" /></button>
        <button type="button" onClick={() => set('seed', randomSeed())} className={icon} aria-label="Shuffle"><Svg d={ICONS.shuffle} title="Shuffle" /></button>
        <button type="button" aria-pressed={reveal} onClick={() => { setReveal((r) => !r); track('key_action', { action: 'reveal', on: !reveal }) }} className={`${icon} ${reveal ? 'bg-ink text-paper' : ''}`} aria-label="Show the depth map"><Svg d={ICONS.eye} title="Show the depth map" /></button>
      </div>
      <PrintPlate src={printSrc} params={params} title="Stereogram" />

      <section aria-label="Scene" className="mt-6">
        <div className="grid grid-cols-5 gap-1" role="group" aria-label="Scene type">
          <button type="button" aria-pressed={sceneKind === 'figure'} className={seg(sceneKind === 'figure')} onClick={() => FIGURES[0] && set('scene', { kind: 'figure', id: FIGURES[0].id })}>Figure</button>
          <button type="button" aria-pressed={sceneKind === 'shape'} className={seg(sceneKind === 'shape')} onClick={() => set('scene', { kind: 'shape', shape: 'sphere' })}>Shape</button>
          <button type="button" aria-pressed={sceneKind === 'text'} className={seg(sceneKind === 'text')} onClick={() => set('scene', { kind: 'text', text: 'HELLO' })}>Text</button>
          <button type="button" aria-pressed={sceneKind === 'draw'} className={seg(sceneKind === 'draw')} onClick={() => set('scene', { kind: 'draw' })}>Draw</button>
          <button type="button" aria-pressed={sceneKind === 'image'} className={seg(sceneKind === 'image')} onClick={() => set('scene', { kind: 'image' })}>Picture</button>
        </div>

        <div className="mt-4">
          {params.scene.kind === 'figure' && (
            <Picker label="Figure" items={figureItems} value={params.scene.id} onChange={(id) => { set('scene', { kind: 'figure', id }); track('key_action', { action: 'pick_figure', id }) }} />
          )}
          {params.scene.kind === 'shape' && <Picker label="Shape" items={shapeItems} value={params.scene.shape} onChange={(id) => set('scene', { kind: 'shape', shape: id as (typeof SHAPES)[number] })} />}
          {params.scene.kind === 'text' && (
            <label className="block">
              <span className={label}>Hidden text</span>
              <input type="text" className={`${field} font-display text-display uppercase`} maxLength={LIMITS.text} value={params.scene.text} onChange={(e) => set('scene', { kind: 'text', text: e.target.value })} placeholder="A WORD OR TWO" autoCapitalize="characters" />
              <span className="mt-1 block text-ink-soft">Short words, big letters. Two or three words wrap onto lines.</span>
            </label>
          )}
          {params.scene.kind === 'draw' && (
            <div>
              <p className={label}>Paint the depth: white is near, black is far</p>
              <div className="mt-1">
                <DepthPainter aspect={params.width / params.height} onChange={setDrawDepth} />
              </div>
            </div>
          )}
          {params.scene.kind === 'image' && (
            <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </section>

      <section aria-label="Pattern" className="mt-6">
        <Picker
          label="Pattern"
          items={patternItems}
          value={params.pattern}
          onChange={(id) => {
            set('pattern', id as PatternChoice)
            if (id === 'image') tileFile.current?.click()
            if (id.startsWith('lib:')) track('key_action', { action: 'pick_pattern', id: id.slice(4) })
          }}
        />
        <input ref={tileFile} type="file" accept="image/*" data-testid="tile-file" className={params.pattern === 'image' ? `${field} mt-2` : 'sr-only'} aria-label="Pattern picture" onChange={async (e) => { const f = e.target.files?.[0]; setTileRgba(f ? await fileToTile(f) : null); track('key_action', { action: 'upload_tile' }) }} />
      </section>

      <details className="mt-6 rounded-md bg-paper-2 px-4 py-2">
        <summary className="min-h-11 cursor-pointer list-none py-2 font-display text-title">Fine-tune</summary>
        <div className="grid gap-6 pb-4 pt-2 sm:grid-cols-2">
          <label className="block">
            <span className={label}>Depth {Math.round(params.depth * 100)}%</span>
            <input type="range" min={LIMITS.depth[0]} max={LIMITS.depth[1]} step={0.01} value={params.depth} onChange={(e) => set('depth', Number(e.target.value))} />
          </label>
          <label className="block">
            <span className={label}>Eye separation {params.eyeSeparation}px</span>
            <input type="range" min={LIMITS.eyeSeparation[0]} max={Math.min(LIMITS.eyeSeparation[1], Math.floor(params.width / 2))} value={params.eyeSeparation} onChange={(e) => set('eyeSeparation', Number(e.target.value))} />
          </label>
          {params.pattern === 'dots' && (
            <label className="block">
              <span className={label}>Dot density {Math.round(params.density * 100)}%</span>
              <input type="range" min={LIMITS.density[0]} max={LIMITS.density[1]} step={0.05} value={params.density} onChange={(e) => set('density', Number(e.target.value))} />
            </label>
          )}
          {sceneKind !== 'shape' && sceneKind !== 'figure' && (
            <label className="block">
              <span className={label}>Smooth edges {params.smooth}px</span>
              <input type="range" min={LIMITS.smooth[0]} max={LIMITS.smooth[1]} value={params.smooth} onChange={(e) => set('smooth', Number(e.target.value))} />
            </label>
          )}
          <div>
            <span className={label}>Viewing</span>
            <div className="mt-1 grid grid-cols-2 gap-2" role="group" aria-label="Viewing mode">
              <button type="button" aria-pressed={params.mode === 'parallel'} className={seg(params.mode === 'parallel')} onClick={() => set('mode', 'parallel')}>Parallel</button>
              <button type="button" aria-pressed={params.mode === 'cross'} className={seg(params.mode === 'cross')} onClick={() => set('mode', 'cross')}>Cross-eyed</button>
            </div>
          </div>
          <label className="block">
            <span className={label}>Seed</span>
            <input type="number" className={`${field} bg-paper`} min={LIMITS.seed[0]} max={LIMITS.seed[1]} value={params.seed} onChange={(e) => set('seed', Math.max(0, Math.min(LIMITS.seed[1], Math.round(Number(e.target.value) || 0))))} />
          </label>
          <label className="block">
            <span className={label}>Size</span>
            <select className={`${field} bg-paper`} value={presetId} onChange={(e) => choosePreset(e.target.value)}>
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
                <input type="number" className={`${field} bg-paper`} min={LIMITS.width[0]} max={LIMITS.width[1]} value={params.width} onChange={(e) => set('width', Math.max(LIMITS.width[0], Math.min(LIMITS.width[1], Math.round(Number(e.target.value) || LIMITS.width[0]))))} />
              </label>
              <label className="block">
                <span className={label}>Height</span>
                <input type="number" className={`${field} bg-paper`} min={LIMITS.height[0]} max={LIMITS.height[1]} value={params.height} onChange={(e) => set('height', Math.max(LIMITS.height[0], Math.min(LIMITS.height[1], Math.round(Number(e.target.value) || LIMITS.height[0]))))} />
              </label>
            </div>
          )}
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="size-6" checked={params.helpers} onChange={(e) => set('helpers', e.target.checked)} />
            <span>Helper dots</span>
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="size-6" checked={params.hiddenSurface} onChange={(e) => set('hiddenSurface', e.target.checked)} />
            <span>Hidden-surface removal</span>
          </label>
        </div>
      </details>

      <p className="mt-6 text-ink-soft">
        Everything happens in your browser; nothing is uploaded. New here? <a className="text-accent underline underline-offset-4" href="#/see">How to see it</a> ·{' '}
        <a className="text-accent underline underline-offset-4" href="#/book/1">the book of plates</a>. Defaults after Thimbleby, Inglis and Witten (1994): {DEFAULT_PARAMS.eyeSeparation} px, depth of field ⅓.
      </p>
    </main>
  )
}
