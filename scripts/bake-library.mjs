#!/usr/bin/env node
// Bake the library: CC0 sculptures (Poly Haven glTF) → 8-bit depth PNGs, and Met Open Access
// ornament → 512 px pattern tiles. Writes public/library/** and src/library/provenance.json.
// Run: node scripts/bake-library.mjs [--figures-only|--patterns-only]. Idempotent; skips existing files.
// Licences: Poly Haven CC0 (https://polyhaven.com/license); Met Open Access CC0 (isPublicDomain only).
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs'
import sharp from 'sharp'
import { execFileSync } from 'node:child_process'
import { readFileSync as readBin, unlinkSync } from 'node:fs'

const SIZE = 512
const OUT_F = 'public/library/figures'
const OUT_P = 'public/library/patterns'
const PROV = 'src/library/provenance.json'
mkdirSync(OUT_F, { recursive: true })
mkdirSync(OUT_P, { recursive: true })

// id → yaw in degrees (rotation about the vertical axis before the orthographic front view), pitch
const FIGURES = {
  bronze_ray_statue: [0, 30, 'Bronze ray statue'],
  bronze_whale_statue: [90, 10, 'Bronze whale statue'],
  bronze_shark_statue: [90, 10, 'Bronze shark statue'],
  carved_wooden_elephant: [120, 10, 'Carved wooden elephant'], // three-quarter view: Pavol, 4 Nov, "rotating it a bit would give more sense"
  concrete_cat_statue: [20, 10, 'Concrete cat statue'],
  gothic_statue: [0, 0, 'Gothic statue'],
  horse_head: [60, 0, 'Horse head'],
  horse_statue_01: [90, 5, 'Horse statue'],
  marble_bust_01: [0, 0, 'Marble bust'],
  bull_head: [0, 0, 'Bull head'],
  lion_head: [0, 0, 'Lion head'],
  lambis_shell: [0, 60, 'Lambis shell'],
  rubber_duck_toy: [90, 10, 'Rubber duck'],
  chess_set: [0, 60, 'Chess set'],
  antique_ceramic_vase_01: [0, 0, 'Antique ceramic vase'],
  brass_vase_01: [0, 0, 'Brass vase'],
  jug_01: [0, 0, 'Jug'],
  food_apple_01: [0, 20, 'Apple'],
  food_pears_asian_01: [0, 20, 'Asian pears'],
  fishermans_hat: [0, 40, "Fisherman's hat"],
  rubber_boots: [90, 10, 'Rubber boots'],
  seadogs_compass: [0, 80, "Sea dog's compass"],
  wooden_bowl_01: [0, 50, 'Wooden bowl'],
  dandelion_01: [0, 0, 'Dandelion'],
  hatchet: [90, 90, 'Hatchet'],
  cross_pein_hammer: [90, 90, 'Cross-pein hammer'],
}

// The relief shelf (approved 2026-11-04): SMK plaster casts (Public Domain Mark, binary STL, Z-up)
// and Smithsonian Open Access 3D (CC0, GLB; draco-compressed files are skipped).
const CASTS = [
  // id, url, title, yaw, pitch, source, licence, page
  ['smk_discobolus', 'https://api.smk.dk/api/v1/download-3d/n583z0576_smk-discobolus.stl', 'Discobolus, Roman copy (cast)', 0, 0, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KAS1549'],
  ['smk_dying_gaul', 'https://api.smk.dk/api/v1/download-3d/5t34sq60f_KAS1312_small.stl', 'The Dying Gaul (cast)', 0, 30, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KAS1312'],
  ['smk_laocoon', 'https://api.smk.dk/api/v1/download-3d/d504rr247_KAS385_small.stl', 'Laocoön and his sons (cast)', 0, 0, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KAS385'],
  ['smk_apollo_belvedere', 'https://api.smk.dk/api/v1/download-3d/wm117v118_smk-apollo-belvedere.stl', 'Apollo Belvedere (cast)', 0, 0, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KAS353'],
  ['smk_barberini_faun', 'https://api.smk.dk/api/v1/download-3d/8w32rb332_KAS208_small.stl', 'The Barberini Faun (cast)', 0, 20, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KAS208'],
  ['smk_hebe', 'https://api.smk.dk/api/v1/download-3d/7p88cn20v_KAS2918_small.stl', 'Hebe (cast)', 0, 0, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KAS2918'],
  ['smk_belvedere_torso', 'https://api.smk.dk/api/v1/download-3d/zs25xf26x_KAS402_small.stl', 'The Belvedere Torso (cast)', 0, 0, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KAS402'],
  ['smk_moses', 'https://api.smk.dk/api/v1/download-3d/pr76f835r_KAS243_small.stl', 'Moses, after Michelangelo (cast)', 0, 0, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KAS243'],
  ['smk_risen_christ', 'https://api.smk.dk/api/v1/download-3d/k930c2765_KAS422_small.stl', 'The Risen Christ (cast)', 0, 0, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KAS422'],
  ['smk_apostle_peter', 'https://api.smk.dk/api/v1/download-3d/8623j340n_KAS2906-8_small.stl', 'The Apostle Peter (cast)', 0, 0, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KAS2906/8'],
  ['smk_sphinx', 'https://api.smk.dk/api/v1/download-3d/f7623j026_KAS38_small.stl', 'Sphinx with the features of Amenemhat (cast)', 0, 0, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KAS38'],
  ['smk_leda', 'https://api.smk.dk/api/v1/download-3d/s7526j33z_KMS5808_small.stl', 'Leda and the Swan (cast)', 0, 0, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KMS5808'],
  ['smk_demosthenes', 'https://api.smk.dk/api/v1/download-3d/v405sg31p_KAS629_small.stl', 'Demosthenes (cast)', 0, 0, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KAS629'],
  ['smk_sophocles', 'https://api.smk.dk/api/v1/download-3d/rx913v90j_KAS633_small.stl', 'Sophocles (cast)', 0, 0, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KAS633'],
  ['smk_julia_domna', 'https://api.smk.dk/api/v1/download-3d/4m90f115c_KAS1236_small.stl', 'Julia Domna (cast)', 0, 0, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KAS1236'],
  ['smk_zuccone', 'https://api.smk.dk/api/v1/download-3d/0z709180b_KAS440_small.stl', 'Il Zuccone, after Donatello (cast)', 0, 0, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KAS440'],
  ['smk_kneeling_venus', 'https://api.smk.dk/api/v1/download-3d/cj82kc853_KAS618_small.stl', 'Kneeling Venus (cast)', 0, 0, 'SMK', 'Public domain', 'https://open.smk.dk/en/artwork/image/KAS618'],
  ['si_roosevelt_relief', 'https://3d-api.si.edu/content/document/3d_package:1788235b-d2bc-4287-8fb5-f2965a069fd9/resources/theodore-roosevelt-bronze-relief-150k-4096.glb', 'Theodore Roosevelt, bronze relief', 0, 0, 'Smithsonian Open Access', 'CC0', 'https://3d.si.edu/object/3d/theodore-roosevelt:1788235b-d2bc-4287-8fb5-f2965a069fd9'],
  ['si_lincoln_life_mask', 'https://3d-api.si.edu/content/document/3d_package:c02c239d-5ebf-4a7a-a368-e2288bbf4b31/resources/abraham-lincoln-mills-life-mask-150k-4096.glb', 'Abraham Lincoln, life mask by Clark Mills', 0, 0, 'Smithsonian Open Access', 'CC0', 'https://3d.si.edu/object/3d/abraham-lincoln:c02c239d-5ebf-4a7a-a368-e2288bbf4b31'],
  ['si_western_paradise', 'https://3d-api.si.edu/content/document/3d_package:727b4bb6-ce87-40de-b07d-d492c1404221/resources/f1921_2-high_res-150k-4096_std.glb', 'Western Paradise of the Buddha Amitabha, stone relief', 0, 0, 'Smithsonian Open Access', 'CC0', 'https://3d.si.edu/object/3d/western-paradise-buddha-amitabha:727b4bb6-ce87-40de-b07d-d492c1404221'],
  ['si_hayes_bust', 'https://3d-api.si.edu/content/document/3d_package:1f3700e8-6d01-4488-8ab9-ea14031ef641/resources/rutherford-b-150k-4096.glb', 'Rutherford B. Hayes, plaster bust', 0, 0, 'Smithsonian Open Access', 'CC0', 'https://3d.si.edu/object/3d/rutherford-b-hayes:1f3700e8-6d01-4488-8ab9-ea14031ef641'],
  ['si_washington_bust', 'https://3d-api.si.edu/content/document/3d_package:ff28cb3a-ad00-43b3-a928-fa61ab0a288f/resources/NPG_78_1-GeorgeWashington-150k-4096_std.glb', 'George Washington, bust after Houdon', 0, 0, 'Smithsonian Open Access', 'CC0', 'https://3d.si.edu/object/3d/george-washington:ff28cb3a-ad00-43b3-a928-fa61ab0a288f'],
  ['si_helen_keller', 'https://3d-api.si.edu/content/document/3d_package:d8c64ccc-4ebc-11ea-b77f-2e728ce88125/resources/HK_NPG_75_16-150k-4096.glb', 'Helen Keller, bust', 0, 0, 'Smithsonian Open Access', 'CC0', 'https://3d.si.edu/object/3d/helen-adams-keller:d8c64ccc-4ebc-11ea-b77f-2e728ce88125'],
  ['si_lincoln_hands', 'https://3d-api.si.edu/content/document/3d_package:d8c642d6-4ebc-11ea-b77f-2e728ce88125/resources/lincoln_hands-150k-4096.glb', "Abraham Lincoln's hands, cast", 0, 60, 'Smithsonian Open Access', 'CC0', 'https://3d.si.edu/object/3d/abraham-lincoln:d8c642d6-4ebc-11ea-b77f-2e728ce88125'],
]

/** Binary STL → triangles; STL from photogrammetry is usually Z-up, so (x, y, z) → (x, z, −y). */
function stlTriangles(buf) {
  const dv = new DataView(buf)
  const n = dv.getUint32(80, true)
  const tris = []
  let o = 84
  for (let i = 0; i < n; i++) {
    o += 12
    const t = []
    for (let k = 0; k < 3; k++) {
      const x = dv.getFloat32(o, true), y = dv.getFloat32(o + 4, true), z = dv.getFloat32(o + 8, true)
      t.push([x, z, -y])
      o += 12
    }
    tris.push(t)
    o += 2
  }
  return tris
}

/** Binary GLB → { gltf JSON, bins }. Draco-compressed meshes are refused. */
function parseGlb(buf) {
  const dv = new DataView(buf)
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('not a glb')
  let o = 12
  let json = null
  const bins = []
  while (o < buf.byteLength) {
    const len = dv.getUint32(o, true), type = dv.getUint32(o + 4, true)
    const chunk = buf.slice(o + 8, o + 8 + len)
    if (type === 0x4e4f534a) json = JSON.parse(Buffer.from(chunk).toString('utf8'))
    else bins.push(chunk)
    o += 8 + len
  }
  if (JSON.stringify(json.extensionsRequired || []).includes('draco')) throw new Error('draco-compressed')
  return { g: json, bins }
}

async function bakeCasts() {
  for (const [id, url, title, yaw, pitch, source, licence, page] of CASTS) {
    const file = `${OUT_F}/${id}.png`
    if (existsSync(file)) continue
    try {
      // large STL downloads get cut off by fetch ("terminated"); curl with retries is patient
      const tmp = `/tmp/bake-${id}`
      execFileSync('curl', ['-sL', '--retry', '5', '--retry-all-errors', '--max-time', '600', '-o', tmp, url], { stdio: 'ignore' })
      const raw = readBin(tmp)
      unlinkSync(tmp)
      const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)
      const tris = url.endsWith('.stl') ? stlTriangles(buf) : (({ g, bins }) => triangles(g, bins))(parseGlb(buf))
      const depth = rasterize(tris, yaw, pitch)
      await sharp(depth, { raw: { width: SIZE, height: SIZE, channels: 1 } }).png({ compressionLevel: 9 }).toFile(file)
      const keep = prov.figures.find((f) => f.id === id) ?? {}
      prov.figures = prov.figures.filter((f) => f.id !== id)
      prov.figures.push({ ...keep, id, title, file: `/library/figures/${id}.png`, source, licence, url: page, credit: `${title}, ${source}, ${licence}` })
      console.log(`cast ${id} (${tris.length} tris)`)
    } catch (e) {
      console.warn(`skip ${id}: ${e.message}`)
    }
  }
}

// query → how many; the Met's full-text search is loose, so each hit is checked for isPublicDomain + an image
const PATTERNS = [
  ['katagami', 6, 'katagami'],
  ['stencil Japan Edo', 4, 'katagami'],
  ['William Morris wallpaper', 6, 'morris'],
  ['Iznik tile', 4, 'iznik'],
  ['Grammar of Ornament', 6, 'ornament'],
  ['wallpaper 18th century', 4, 'wallpaper'],
  ['Ottoman textile fragment', 4, 'ottoman'],
  ['Coptic textile', 3, 'coptic'],
  // floral (Pavol, 4 Nov: "can we get more floral ones?")
  ['chintz floral textile', 6, 'floral'],
  ['palampore', 4, 'floral'],
  ['brocade flowers silk', 5, 'floral'],
  ['floral wallpaper', 6, 'floral'],
  ['kimono flowers', 4, 'floral'],
  ['Morris Acanthus', 3, 'floral'],
  ['embroidered flowers linen', 4, 'floral'],
]

const only = process.argv[2]
const prov = existsSync(PROV) ? JSON.parse(readFileSync(PROV, 'utf8')) : { figures: [], patterns: [] }

async function json(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.json()
}

// ---------- glTF → depth ----------
const CTYPE = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }

function accessor(g, bins, i) {
  const a = g.accessors[i]
  const bv = g.bufferViews[a.bufferView]
  const T = CTYPE[a.componentType]
  const n = NCOMP[a.type]
  const stride = bv.byteStride || n * T.BYTES_PER_ELEMENT
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0)
  const buf = bins[bv.buffer]
  const out = new T(a.count * n)
  for (let k = 0; k < a.count; k++) {
    const view = new T(buf, base + k * stride, n)
    out.set(view, k * n)
  }
  return { data: out, n }
}

function mat4mul(a, b) {
  const o = new Array(16).fill(0)
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]
  return o
}
function trs(node) {
  if (node.matrix) return node.matrix
  const [tx, ty, tz] = node.translation || [0, 0, 0]
  const [qx, qy, qz, qw] = node.rotation || [0, 0, 0, 1]
  const [sx, sy, sz] = node.scale || [1, 1, 1]
  const xx = qx * qx, yy = qy * qy, zz = qz * qz, xy = qx * qy, xz = qx * qz, yz = qy * qz, wx = qw * qx, wy = qw * qy, wz = qw * qz
  return [
    (1 - 2 * (yy + zz)) * sx, 2 * (xy + wz) * sx, 2 * (xz - wy) * sx, 0,
    2 * (xy - wz) * sy, (1 - 2 * (xx + zz)) * sy, 2 * (yz + wx) * sy, 0,
    2 * (xz + wy) * sz, 2 * (yz - wx) * sz, (1 - 2 * (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ]
}
function apply(m, x, y, z) {
  return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]
}

/** All world-space triangles of the scene. */
function triangles(g, bins) {
  const tris = []
  const visit = (ni, parent) => {
    const node = g.nodes[ni]
    const world = mat4mul(parent, trs(node))
    if (node.mesh != null)
      for (const p of g.meshes[node.mesh].primitives) {
        if ((p.mode ?? 4) !== 4) continue
        const pos = accessor(g, bins, p.attributes.POSITION)
        const idx = p.indices != null ? accessor(g, bins, p.indices).data : Uint32Array.from({ length: pos.data.length / 3 }, (_, i) => i)
        const v = []
        for (let i = 0; i < pos.data.length; i += 3) v.push(apply(world, pos.data[i], pos.data[i + 1], pos.data[i + 2]))
        for (let i = 0; i + 2 < idx.length; i += 3) tris.push([v[idx[i]], v[idx[i + 1]], v[idx[i + 2]]])
      }
    for (const c of node.children || []) visit(c, world)
  }
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  for (const n of (g.scenes?.[g.scene ?? 0]?.nodes) ?? g.nodes.map((_, i) => i)) visit(n, I)
  return tris
}

/** Orthographic front view after yaw (about Y) and pitch (about X); nearest = 255, background = 0. */
function rasterize(tris, yaw, pitch) {
  const cy = Math.cos((yaw * Math.PI) / 180), sy = Math.sin((yaw * Math.PI) / 180)
  const cp = Math.cos((pitch * Math.PI) / 180), sp = Math.sin((pitch * Math.PI) / 180)
  const rot = ([x, y, z]) => {
    const x1 = cy * x + sy * z, z1 = -sy * x + cy * z
    const y2 = cp * y - sp * z1, z2 = sp * y + cp * z1
    return [x1, y2, z2]
  }
  const T = tris.map((t) => t.map(rot))
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity
  for (const t of T) for (const [x, y, z] of t) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z)
  }
  const span = Math.max(maxX - minX, maxY - minY)
  const pad = 0.06
  const s = (SIZE * (1 - 2 * pad)) / span
  const ox = SIZE / 2 - ((minX + maxX) / 2) * s
  const oy = SIZE / 2 + ((minY + maxY) / 2) * s
  const zbuf = new Float32Array(SIZE * SIZE).fill(-Infinity)
  for (const t of T) {
    const p = t.map(([x, y, z]) => [x * s + ox, oy - y * s, z])
    const x0 = Math.max(0, Math.floor(Math.min(p[0][0], p[1][0], p[2][0]))), x1 = Math.min(SIZE - 1, Math.ceil(Math.max(p[0][0], p[1][0], p[2][0])))
    const y0 = Math.max(0, Math.floor(Math.min(p[0][1], p[1][1], p[2][1]))), y1 = Math.min(SIZE - 1, Math.ceil(Math.max(p[0][1], p[1][1], p[2][1])))
    const [ax, ay, az] = p[0], [bx, by, bz] = p[1], [cx, cy2, cz] = p[2]
    const det = (bx - ax) * (cy2 - ay) - (cx - ax) * (by - ay)
    if (Math.abs(det) < 1e-9) continue
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5
        const l1 = ((bx - px) * (cy2 - py) - (cx - px) * (by - py)) / det
        const l2 = ((cx - px) * (ay - py) - (ax - px) * (cy2 - py)) / det
        const l3 = 1 - l1 - l2
        if (l1 < 0 || l2 < 0 || l3 < 0) continue
        const z = l1 * az + l2 * bz + l3 * cz
        const i = y * SIZE + x
        if (z > zbuf[i]) zbuf[i] = z
      }
  }
  // normalise over covered pixels only (do not squash the object into the far plane)
  let zmin = Infinity, zmax = -Infinity
  for (const z of zbuf) if (z !== -Infinity) { zmin = Math.min(zmin, z); zmax = Math.max(zmax, z) }
  const out = Buffer.alloc(SIZE * SIZE)
  for (let i = 0; i < zbuf.length; i++) out[i] = zbuf[i] === -Infinity ? 0 : Math.round(40 + 215 * ((zbuf[i] - zmin) / (zmax - zmin || 1)))
  return out
}

async function bakeFigures() {
  for (const [id, [yaw0, pitch0, title]] of Object.entries(FIGURES)) {
    const only1 = process.env.ONLY
    if (only1 && only1 !== id) continue
    const yaw = process.env.YAW ? Number(process.env.YAW) : yaw0
    const pitch = process.env.PITCH ? Number(process.env.PITCH) : pitch0
    const file = process.env.OUT ? process.env.OUT : `${OUT_F}/${id}.png`
    if (existsSync(file) && !process.env.OUT) continue
    try {
      const files = await json(`https://api.polyhaven.com/files/${id}`)
      const g1k = files.gltf?.['1k']?.gltf
      if (!g1k) { console.warn(`skip ${id}: no 1k gltf`); continue }
      const g = await json(g1k.url)
      const bins = []
      for (const b of g.buffers) {
        const inc = Object.entries(g1k.include || {}).find(([k]) => k.endsWith(b.uri))
        const url = inc ? inc[1].url : new URL(b.uri, g1k.url).href
        bins.push(await (await fetch(url)).arrayBuffer())
      }
      const tris = triangles(g, bins)
      const depth = rasterize(tris, yaw, pitch)
      await sharp(depth, { raw: { width: SIZE, height: SIZE, channels: 1 } }).png({ compressionLevel: 9 }).toFile(file)
      if (process.env.OUT) { console.log(`review ${id} yaw ${yaw} pitch ${pitch}`); continue }
      const keep = prov.figures.find((f) => f.id === id) ?? {}
      prov.figures = prov.figures.filter((f) => f.id !== id)
      prov.figures.push({ ...keep, id, title, file: `/library/figures/${id}.png`, source: 'Poly Haven', licence: 'CC0', url: `https://polyhaven.com/a/${id}`, credit: `${title}, Poly Haven, CC0` })
      console.log(`figure ${id} (${tris.length} tris)`)
    } catch (e) {
      console.warn(`skip ${id}: ${e.message}`)
    }
  }
}

// ---------- Met → tiles ----------
// Tiles a person removed stay removed: a re-run must not fetch them back (4–5 Nov 2026: the floral
// bake re-downloaded two mount crops that had been deleted, and plate 1 used one of them).
// 7 Nov: tiles that fail src/domain/tileQuality.ts (blank paper, solid ground, stripes, repeats);
// src/library/tiles.quality.test.ts fails CI if a bake brings in another one.
const REFUSED = new Set(['katagami-61835', 'katagami-61838', 'floral-207665', 'floral-436525', 'floral-437999', 'floral-73142', 'floral-76988', 'floral-910072', 'coptic-443300', 'coptic-444296', 'coptic-446011', 'floral-13608', 'floral-13612', 'floral-13874', 'floral-228211', 'floral-447418', 'katagami-53913', 'katagami-64388', 'katagami-65078', 'morris-365338', 'morris-383485', 'morris-384017', 'ornament-334214', 'ornament-700091', 'wallpaper-359990', 'wallpaper-9663'])

async function bakePatterns() {
  for (const [q, n, tag] of PATTERNS) {
    let hits
    try {
      hits = await json(`https://collectionapi.metmuseum.org/public/collection/v1.1/search?q=${encodeURIComponent(q)}&hasImages=true&isPublicDomain=true&limit=${n * 3}`)
    } catch (e) { console.warn(`skip query ${q}: ${e.message}`); continue }
    let taken = 0
    for (const oid of hits.objectIDs || []) {
      if (taken >= n) break
      const id = `${tag}-${oid}`
      if (REFUSED.has(id)) continue
      const file = `${OUT_P}/${id}.png`
      if (existsSync(file)) { taken++; continue }
      try {
        const o = await json(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${oid}`)
        if (!o.isPublicDomain || !o.primaryImage) continue
        const img = Buffer.from(await (await fetch(o.primaryImage)).arrayBuffer())
        // centre crop: the ornament, not the mount or the margin
        const meta = await sharp(img).metadata()
        const side = Math.round(Math.min(meta.width, meta.height) * 0.6)
        await sharp(img)
          .extract({ left: Math.round((meta.width - side) / 2), top: Math.round((meta.height - side) / 2), width: side, height: side })
          .resize(SIZE, SIZE)
          .png({ compressionLevel: 9, palette: true })
          .toFile(file)
        prov.patterns = prov.patterns.filter((p) => p.id !== id)
        const title = o.title || q
        prov.patterns.push({ id, title, file: `/library/patterns/${id}.png`, source: 'The Metropolitan Museum of Art, Open Access', licence: 'CC0', url: o.objectURL, date: o.objectDate || '', credit: `${title}${o.objectDate ? ', ' + o.objectDate : ''}, The Met, CC0` })
        taken++
        console.log(`pattern ${id}: ${title}`)
      } catch (e) {
        console.warn(`skip ${oid}: ${e.message}`)
      }
    }
  }
}

if (only !== '--patterns-only') await bakeFigures()
if (only !== '--patterns-only') await bakeCasts()
if (only !== '--figures-only') await bakePatterns()
prov.figures.sort((a, b) => a.title.localeCompare(b.title))
prov.patterns.sort((a, b) => a.id.localeCompare(b.id))
writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n')
console.log(`provenance: ${prov.figures.length} figures, ${prov.patterns.length} patterns`)
