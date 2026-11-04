// Depth sources that need a canvas: text, uploaded pictures, pattern tiles. The pure
// conversion lives in src/domain/depth.ts; this file only produces Rgba from the DOM.
import type { DepthMap, Rgba } from '@/domain/depth'
import { depthFromRgba } from '@/domain/depth'

function canvas2d(width: number, height: number) {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('canvas 2d unavailable')
  return { c, ctx }
}

/** White text on black, sized to fit ~80 % of the width, as a depth map (letters stand proud of the page). */
export function textDepth(text: string, width: number, height: number): DepthMap {
  const { c, ctx } = canvas2d(width, height)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)
  const t = text.trim() || ' '
  let size = Math.floor(height * 0.5)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const font = (s: number) => `900 ${s}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-sans') || 'sans-serif'}`
  ctx.font = font(size)
  while (size > 8 && ctx.measureText(t).width > width * 0.82) {
    size = Math.floor(size * 0.9)
    ctx.font = font(size)
  }
  ctx.fillStyle = '#fff'
  ctx.fillText(t, width / 2, height / 2)
  const img = ctx.getImageData(0, 0, c.width, c.height)
  return depthFromRgba({ width: img.width, height: img.height, data: img.data })
}

/** Decode a picture file, cover-fit into width × height (so a portrait map still fills a landscape page). */
export async function fileToRgba(file: Blob, width: number, height: number): Promise<Rgba> {
  const bmp = await createImageBitmap(file)
  const { c, ctx } = canvas2d(width, height)
  const scale = Math.max(width / bmp.width, height / bmp.height)
  const w = bmp.width * scale
  const h = bmp.height * scale
  ctx.drawImage(bmp, (width - w) / 2, (height - h) / 2, w, h)
  bmp.close()
  const img = ctx.getImageData(0, 0, c.width, c.height)
  return { width: img.width, height: img.height, data: img.data }
}

/** A pattern tile at its own size, capped at 512 px wide (it is refitted to the strip width when rendering). */
export async function fileToTile(file: Blob): Promise<Rgba> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 512 / bmp.width)
  const w = Math.max(1, Math.round(bmp.width * scale))
  const h = Math.max(1, Math.round(bmp.height * scale))
  const { c, ctx } = canvas2d(w, h)
  ctx.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  const img = ctx.getImageData(0, 0, c.width, c.height)
  return { width: img.width, height: img.height, data: img.data }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  )
}
