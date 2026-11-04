import type { DepthMap, Rgba } from '@/domain/depth'
import { renderStereogram, type StereogramOptions } from '@/domain/stereogram'
import type { RenderRequest } from './render.worker'

/** Renders in a Worker when the platform has one (browsers), synchronously otherwise (jsdom tests). Stale results are dropped. */
export function createRenderer() {
  let worker: Worker | null = null
  let seq = 0
  const pending = new Map<number, (img: Rgba) => void>()

  if (typeof Worker !== 'undefined') {
    try {
      worker = new Worker(new URL('./render.worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (e: MessageEvent<{ id: number; img: Rgba }>) => {
        const done = pending.get(e.data.id)
        pending.delete(e.data.id)
        done?.(e.data.img)
      }
    } catch {
      worker = null
    }
  }

  return {
    /** Resolves with the picture, or never if a newer request superseded it. */
    render(depth: DepthMap, opts: StereogramOptions): Promise<Rgba> {
      const id = ++seq
      if (!worker) return Promise.resolve(renderStereogram(depth, opts))
      return new Promise((resolve) => {
        pending.clear() // one in-flight result matters: the latest
        pending.set(id, resolve)
        const req: RenderRequest = { id, depth: { ...depth, data: new Float32Array(depth.data) }, opts }
        worker!.postMessage(req, [req.depth.data.buffer])
      })
    },
    dispose() {
      worker?.terminate()
    },
  }
}
