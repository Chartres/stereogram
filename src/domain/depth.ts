// Depth maps: width × height floats in [0, 1]. 0 = far plane (the background), 1 = nearest.
// Framework-free; the UI converts canvases/images to Rgba and calls depthFromRgba.

export interface DepthMap {
  width: number
  height: number
  data: Float32Array
}

/** Raw RGBA pixels, same layout as ImageData (so the UI can pass ImageData straight in). */
export interface Rgba {
  width: number
  height: number
  data: Uint8ClampedArray
}

export const SHAPES = ['sphere', 'torus', 'pyramid', 'cone', 'ripple', 'stairs', 'hills', 'heart'] as const
export type Shape = (typeof SHAPES)[number]

export const SHAPE_LABELS: Record<Shape, string> = {
  sphere: 'Sphere',
  torus: 'Ring',
  pyramid: 'Pyramid',
  cone: 'Cone',
  ripple: 'Ripple',
  stairs: 'Stairs',
  hills: 'Hills',
  heart: 'Heart',
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** Height function in normalized coordinates: u, v in [-1, 1] with the shorter side mapped to [-1, 1]. */
function heightFn(shape: Shape): (u: number, v: number) => number {
  switch (shape) {
    case 'sphere':
      return (u, v) => {
        const d2 = (u * u + v * v) / (0.82 * 0.82)
        return d2 < 1 ? Math.sqrt(1 - d2) : 0
      }
    case 'torus':
      return (u, v) => {
        const r = Math.sqrt(u * u + v * v)
        const t = (r - 0.62) / 0.26
        return t * t < 1 ? Math.sqrt(1 - t * t) : 0
      }
    case 'pyramid':
      return (u, v) => clamp01(1 - Math.max(Math.abs(u), Math.abs(v)) / 0.88)
    case 'cone':
      return (u, v) => clamp01(1 - Math.sqrt(u * u + v * v) / 0.88)
    case 'ripple':
      return (u, v) => {
        const r = Math.sqrt(u * u + v * v)
        return clamp01((0.5 + 0.5 * Math.cos(r * 14)) * clamp01(1.2 - r))
      }
    case 'stairs':
      return (u) => Math.floor(clamp01((u + 1) / 2) * 5) / 5
    case 'hills':
      return (u, v) => clamp01(0.5 + 0.5 * Math.sin(u * 3.2) * Math.cos(v * 3.2))
    case 'heart':
      return (u, v) => {
        // Classic implicit heart: (x² + y² − 1)³ − x² y³ < 0 is inside. Scaled to fit.
        const x = u / 0.8
        const y = -v / 0.8 + 0.1
        const a = x * x + y * y - 1
        const inside = a * a * a - x * x * y * y * y
        if (inside > 0) return 0
        // soft dome inside the outline
        return clamp01(Math.min(1, -inside * 6) ** 0.5)
      }
  }
}

export function shapeDepth(shape: Shape, width: number, height: number): DepthMap {
  const data = new Float32Array(width * height)
  const fn = heightFn(shape)
  const half = Math.min(width, height) / 2
  for (let y = 0; y < height; y++) {
    const v = (y - height / 2) / half
    for (let x = 0; x < width; x++) {
      const u = (x - width / 2) / half
      data[y * width + x] = clamp01(fn(u, v))
    }
  }
  return { width, height, data }
}

export function flatDepth(width: number, height: number, z = 0): DepthMap {
  return { width, height, data: new Float32Array(width * height).fill(z) }
}

/** Grey level → depth: white = near, black = far (the usual depth-map convention; invert flips it). */
export function depthFromRgba(src: Rgba, opts: { invert?: boolean; smooth?: number } = {}): DepthMap {
  const { width, height } = src
  const data = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const r = src.data[i * 4]
    const g = src.data[i * 4 + 1]
    const b = src.data[i * 4 + 2]
    const a = src.data[i * 4 + 3] / 255
    const lum = ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * a
    data[i] = opts.invert ? 1 - lum : lum
  }
  const d = { width, height, data }
  return opts.smooth ? blurDepth(d, opts.smooth) : d
}

/** Separable box blur, radius in pixels. Softens the staircase edges of 8-bit uploads. */
export function blurDepth(d: DepthMap, radius: number): DepthMap {
  const r = Math.max(0, Math.floor(radius))
  if (r === 0) return d
  const { width, height } = d
  const tmp = new Float32Array(width * height)
  const out = new Float32Array(width * height)
  const n = 2 * r + 1
  for (let y = 0; y < height; y++) {
    let sum = 0
    for (let x = -r; x <= r; x++) sum += d.data[y * width + Math.min(width - 1, Math.max(0, x))]
    for (let x = 0; x < width; x++) {
      tmp[y * width + x] = sum / n
      const add = Math.min(width - 1, x + r + 1)
      const sub = Math.max(0, x - r)
      sum += d.data[y * width + add] - d.data[y * width + sub]
    }
  }
  for (let x = 0; x < width; x++) {
    let sum = 0
    for (let y = -r; y <= r; y++) sum += tmp[Math.min(height - 1, Math.max(0, y)) * width + x]
    for (let y = 0; y < height; y++) {
      out[y * width + x] = sum / n
      const add = Math.min(height - 1, y + r + 1)
      const sub = Math.max(0, y - r)
      sum += tmp[add * width + x] - tmp[sub * width + x]
    }
  }
  return { width, height, data: out }
}

/** Bilinear resample to a new size (used for drawings and uploads that were captured at another resolution). */
export function resampleDepth(d: DepthMap, width: number, height: number): DepthMap {
  if (d.width === width && d.height === height) return d
  const out = new Float32Array(width * height)
  const sx = d.width / width
  const sy = d.height / height
  for (let y = 0; y < height; y++) {
    const fy = Math.min(d.height - 1, (y + 0.5) * sy - 0.5)
    const y0 = Math.max(0, Math.floor(fy))
    const y1 = Math.min(d.height - 1, y0 + 1)
    const ty = fy - y0
    for (let x = 0; x < width; x++) {
      const fx = Math.min(d.width - 1, (x + 0.5) * sx - 0.5)
      const x0 = Math.max(0, Math.floor(fx))
      const x1 = Math.min(d.width - 1, x0 + 1)
      const tx = fx - x0
      const a = d.data[y0 * d.width + x0]
      const b = d.data[y0 * d.width + x1]
      const c = d.data[y1 * d.width + x0]
      const e = d.data[y1 * d.width + x1]
      out[y * width + x] = (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + e * tx) * ty
    }
  }
  return { width, height, data: out }
}

/** Contain-fit a depth map (a baked figure) into width × height, centred on the far plane; `fill` is the share of the shorter side it occupies. */
export function fitDepth(d: DepthMap, width: number, height: number, fill = 0.96): DepthMap {
  const s = Math.min(width / d.width, height / d.height) * fill
  const w = Math.max(1, Math.round(d.width * s))
  const h = Math.max(1, Math.round(d.height * s))
  const r = resampleDepth(d, w, h)
  const out = flatDepth(width, height)
  const ox = Math.round((width - w) / 2)
  const oy = Math.round((height - h) / 2)
  for (let y = 0; y < h; y++) out.data.set(r.data.subarray(y * w, (y + 1) * w), (oy + y) * width + ox)
  return out
}

export function invertDepth(d: DepthMap): DepthMap {
  const data = new Float32Array(d.data.length)
  for (let i = 0; i < data.length; i++) data[i] = 1 - d.data[i]
  return { width: d.width, height: d.height, data }
}

/** Greyscale picture of a depth map (for the "reveal" toggle and for tests). */
export function depthToRgba(d: DepthMap): Rgba {
  const data = new Uint8ClampedArray(d.width * d.height * 4)
  for (let i = 0; i < d.data.length; i++) {
    const v = Math.round(clamp01(d.data[i]) * 255)
    data[i * 4] = v
    data[i * 4 + 1] = v
    data[i * 4 + 2] = v
    data[i * 4 + 3] = 255
  }
  return { width: d.width, height: d.height, data }
}
