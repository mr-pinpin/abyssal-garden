// landcover-derive (Konev, 19 Nov 2026): from the ChatGPT-generated semantic landcover (assets/atlas-studies/landcover-seed-v2.png,
// eight-colour palette in generated-textures-v2.json) derive, deterministically and with no hand placement:
//   assets/derived/ground-types.png   RGBA = path/dirt, open soil, water edge/mud, rock+props  (grass = remainder), read by the renderer
//   assets/derived/vegetation-density.png RGBA = woodland trees, deciduous margins, fern/grass, flower meadow (blurred to densities)
//   assets/derived/derived.json  provenance: source sha256, palette, tool, sizes
// Usage: node tools/landcover-derive.mjs   (run from source/). Stdlib only.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { png } from '../tests/png.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let i = 8, width, height, depth, type; const idat = [];
  while (i < buf.length) {
    const len = buf.readUInt32BE(i), tag = buf.toString('ascii', i + 4, i + 8), data = buf.subarray(i + 8, i + 8 + len);
    if (tag === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); depth = data[8]; type = data[9]; if (data[12]) throw new Error('interlaced PNG'); }
    else if (tag === 'IDAT') idat.push(data);
    else if (tag === 'IEND') break;
    i += 12 + len;
  }
  if (depth !== 8 || ![2, 6, 0].includes(type)) throw new Error(`unsupported PNG depth ${depth} type ${type}`);
  const ch = type === 6 ? 4 : type === 2 ? 3 : 1, stride = width * ch, raw = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(width * height * 4);
  let prev = Buffer.alloc(stride), p = 0;
  for (let y = 0; y < height; y++) {
    const f = raw[p++], line = Buffer.from(raw.subarray(p, p + stride)); p += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? line[x - ch] : 0, b = prev[x], c = x >= ch ? prev[x - ch] : 0;
      const pr = (() => { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; })();
      line[x] = (line[x] + [0, a, b, (a + b) >> 1, pr][f]) & 255;
    }
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4, s = x * ch;
      if (ch === 1) { out[o] = out[o + 1] = out[o + 2] = line[s]; out[o + 3] = 255; }
      else { out[o] = line[s]; out[o + 1] = line[s + 1]; out[o + 2] = line[s + 2]; out[o + 3] = ch === 4 ? line[s + 3] : 255; }
    }
    prev = line;
  }
  return { width, height, data: out };
}

export const PALETTE = [
  ['woodland', [0x00, 0x66, 0x00]], ['margin', [0x66, 0xcc, 0x33]], ['fern', [0x99, 0x99, 0x00]], ['meadow', [0xff, 0x66, 0xcc]],
  ['water', [0x00, 0x00, 0xff]], ['path', [0xff, 0x00, 0x00]], ['prop', [0xff, 0xff, 0xff]], ['open', [0x00, 0x00, 0x00]],
];

export function classify(img) {
  const n = img.width * img.height, cls = new Uint8Array(n);
  for (let k = 0; k < n; k++) {
    const r = img.data[k * 4], g = img.data[k * 4 + 1], b = img.data[k * 4 + 2];
    let best = 0, bd = Infinity;
    PALETTE.forEach(([, c], j) => { const d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2; if (d < bd) { bd = d; best = j; } });
    cls[k] = best;
  }
  return cls;
}

function downsample(cls, w, h, W, H, want) {           // fraction of each output cell covered by class `want`
  const out = new Float32Array(W * H), sx = w / W, sy = h / H;
  for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
    let hit = 0, tot = 0;
    for (let y = Math.floor(Y * sy); y < Math.floor((Y + 1) * sy); y++) for (let x = Math.floor(X * sx); x < Math.floor((X + 1) * sx); x++) { tot++; if (cls[y * w + x] === want) hit++; }
    out[Y * W + X] = tot ? hit / tot : 0;
  }
  return out;
}

function blur(a, W, H, r) {
  const t = new Float32Array(a.length), o = new Float32Array(a.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0, c = 0; for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < W) { s += a[y * W + xx]; c++; } } t[y * W + x] = s / c; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0, c = 0; for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < H) { s += t[yy * W + x]; c++; } } o[y * W + x] = s / c; }
  return o;
}

export function derive(img, W = 768, H = 512) {
  const cls = classify(img), id = Object.fromEntries(PALETTE.map(([k], j) => [k, j]));
  const f = (k) => downsample(cls, img.width, img.height, W, H, id[k]);
  const path_ = f('path'), open = f('open'), water = f('water'), prop = f('prop');
  const edge = blur(water, W, H, 3).map((v, k) => Math.min(1, v * 2.5) * (1 - water[k]));   // shore band just outside the water, none inside
  const ground = { width: W, height: H, data: new Uint8ClampedArray(W * H * 4) };
  const veg = { width: W, height: H, data: new Uint8ClampedArray(W * H * 4) };
  const wood = blur(f('woodland'), W, H, 2), margin = blur(f('margin'), W, H, 2), fern = blur(f('fern'), W, H, 2), meadow = blur(f('meadow'), W, H, 2);
  for (let k = 0; k < W * H; k++) {
    ground.data[k * 4] = path_[k] * 255; ground.data[k * 4 + 1] = open[k] * 255; ground.data[k * 4 + 2] = edge[k] * 255; ground.data[k * 4 + 3] = prop[k] * 255;
    veg.data[k * 4] = wood[k] * 255; veg.data[k * 4 + 1] = margin[k] * 255; veg.data[k * 4 + 2] = fern[k] * 255; veg.data[k * 4 + 3] = meadow[k] * 255;
  }
  const counts = Object.fromEntries(PALETTE.map(([k], j) => [k, cls.reduce((s, c) => s + (c === j), 0) / cls.length]));
  return { ground, veg, counts };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const src = path.join(root, 'assets/atlas-studies/landcover-seed-v2.png'), bytes = fs.readFileSync(src);
  const { ground, veg, counts } = derive(decodePNG(bytes));
  const out = path.join(root, 'assets/derived');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'ground-types.png'), png(ground));
  fs.writeFileSync(path.join(out, 'vegetation-density.png'), png(veg));
  fs.writeFileSync(path.join(out, 'derived.json'), JSON.stringify({
    tool: 'source/tools/landcover-derive.mjs', source: 'assets/atlas-studies/landcover-seed-v2.png',
    sourceSHA256: createHash('sha256').update(bytes).digest('hex'), sourceProvenance: 'assets/atlas-studies/generated-textures-v2.json',
    generator: 'ChatGPT image generation (see sourceProvenance); this file is a deterministic derivation, no hand placement',
    frame: 'atlas image plane, u=x/width, v=y/height, origin top-left', size: [ground.width, ground.height],
    groundTypes: { R: 'path/track', G: 'open ground (soil)', B: 'water edge band (mud)', A: 'props/buildings/rocks', grass: '1-R-G-B-A' },
    vegetationDensity: { R: 'dense woodland (trees)', G: 'deciduous margins (shrubs, young trees)', B: 'fern/grass', A: 'flower meadow' },
    classShare: Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, +v.toFixed(4)])),
  }, null, 1) + '\n');
  console.log('derived', ground.width + 'x' + ground.height, JSON.stringify(Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, +v.toFixed(3)]))));
}
