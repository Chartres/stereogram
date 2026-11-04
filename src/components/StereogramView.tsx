import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { createRenderer } from '@/app/renderer'
import { textDepth } from '@/app/sources'
import { blurDepth, depthFromRgba, depthToRgba, fitDepth, flatDepth, resampleDepth, shapeDepth, type DepthMap, type Rgba } from '@/domain/depth'
import type { Params } from '@/domain/params'
import { proceduralTile, type Tile } from '@/domain/pattern'
import { helperDots, type PatternSpec } from '@/domain/stereogram'
import { loadFigure, loadPattern } from '@/library'

export interface Sources {
  imageRgba?: Rgba | null
  drawDepth?: DepthMap | null
  tileRgba?: Rgba | null
}

/** Depth map and pattern for a Params, with the async library parts resolved. */
export function useResolved(params: Params, sources: Sources = {}) {
  const [figure, setFigure] = useState<{ id: string; depth: DepthMap } | null>(null)
  const [tile, setTile] = useState<{ id: string; rgba: Rgba } | null>(null)
  const figureId = params.scene.kind === 'figure' ? params.scene.id : null
  const tileId = params.pattern.startsWith('lib:') ? params.pattern.slice(4) : null

  useEffect(() => {
    if (!figureId) return
    let live = true
    loadFigure(figureId).then((depth) => live && setFigure({ id: figureId, depth }))
    return () => {
      live = false
    }
  }, [figureId])

  useEffect(() => {
    if (!tileId) return
    let live = true
    loadPattern(tileId).then((rgba) => live && setTile({ id: tileId, rgba }))
    return () => {
      live = false
    }
  }, [tileId])

  const depth = useMemo<DepthMap>(() => {
    const { width, height, scene, smooth, invert } = params
    switch (scene.kind) {
      case 'shape':
        return shapeDepth(scene.shape, width, height)
      case 'figure':
        return figure && figure.id === scene.id ? fitDepth(figure.depth, width, height) : flatDepth(width, height)
      case 'text':
        return blurDepth(textDepth(scene.text, width, height), smooth)
      case 'image':
        return sources.imageRgba ? depthFromRgba(sources.imageRgba, { invert, smooth }) : flatDepth(width, height)
      case 'draw':
        return sources.drawDepth ? blurDepth(resampleDepth(sources.drawDepth, width, height), smooth) : flatDepth(width, height)
    }
  }, [params, figure, sources.imageRgba, sources.drawDepth])

  const pattern = useMemo<PatternSpec>(() => {
    const p = params.pattern
    if (p === 'dots') return { kind: 'dots', density: params.density }
    if (p === 'color') return { kind: 'color' }
    if (p === 'image') return sources.tileRgba ? { kind: 'tile', tile: sources.tileRgba } : { kind: 'dots', density: params.density }
    if (p.startsWith('lib:')) return tile && tile.id === p.slice(4) ? { kind: 'tile', tile: tile.rgba } : { kind: 'dots', density: params.density }
    return { kind: 'tile', tile: proceduralTile(p as Tile, 128, params.seed) }
  }, [params.pattern, params.density, params.seed, sources.tileRgba, tile])

  const loading = (!!figureId && figure?.id !== figureId) || (!!tileId && tile?.id !== tileId)
  return { depth, pattern, loading }
}

interface Props {
  params: Params
  sources?: Sources
  reveal?: boolean
  /** Re-seed the free pixels every 120 ms (Thimbleby's time-multiplexed viewing aid). */
  shimmer?: boolean
  canvasRef?: RefObject<HTMLCanvasElement | null>
  label: string
  testId?: string
  className?: string
}

/** The picture itself: a canvas that re-renders in a Worker whenever params or sources change. */
export function StereogramView({ params, sources = {}, reveal = false, shimmer = false, canvasRef: outerRef, label, testId = 'stereogram', className = '' }: Props) {
  const innerRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = outerRef ?? innerRef
  const { depth, pattern, loading } = useResolved(params, sources)
  const renderer = useMemo(createRenderer, [])
  useEffect(() => () => renderer.dispose(), [renderer])
  const [renders, setRenders] = useState(0)
  const [busy, setBusy] = useState(false)
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!shimmer) return
    const t = setInterval(() => setFrame((f) => f + 1), 120)
    return () => clearInterval(t)
  }, [shimmer])

  useEffect(() => {
    const c = canvasRef.current
    if (!c || loading) return
    setBusy(true)
    const t = setTimeout(async () => {
      const img = reveal
        ? depthToRgba(depth)
        : await renderer.render(depth, {
            eyeSeparation: params.eyeSeparation,
            depthOfField: params.depth,
            mode: params.mode,
            hiddenSurface: params.hiddenSurface,
            seed: params.seed + frame * 7919,
            pattern,
          })
      if (!canvasRef.current) return
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
    }, shimmer ? 0 : 40)
    return () => clearTimeout(t)
  }, [depth, pattern, loading, params.eyeSeparation, params.depth, params.mode, params.hiddenSurface, params.seed, params.helpers, reveal, renderer, frame, shimmer, canvasRef])

  return (
    <canvas
      ref={canvasRef}
      data-testid={testId}
      data-renders={renders}
      data-busy={busy || loading ? '1' : '0'}
      role="img"
      aria-label={label}
      className={`block w-full rounded-md bg-paper-2 ${className}`}
      style={{ aspectRatio: `${params.width} / ${params.height}` }}
    />
  )
}
