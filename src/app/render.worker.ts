// Off-main-thread render so an A4 print (8.7 Mpx) never freezes the controls.
import { renderStereogram, type StereogramOptions } from '@/domain/stereogram'
import type { DepthMap } from '@/domain/depth'

export interface RenderRequest {
  id: number
  depth: DepthMap
  opts: StereogramOptions
}

self.onmessage = (e: MessageEvent<RenderRequest>) => {
  const { id, depth, opts } = e.data
  const img = renderStereogram(depth, opts)
  ;(self as unknown as Worker).postMessage({ id, img }, [img.data.buffer])
}
