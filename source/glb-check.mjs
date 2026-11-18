// Checks a Blender export with the same parser the gltf-loader plugin runs in the browser.
//   node glb-check.mjs ../assets/ship.glb     parse it and print vertex / triangle counts and bounds
//   node glb-check.mjs --example out.glb       write a small example .glb (a unit cube with node transform) and check it
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.join(here, 'plugins/gltf-loader/plugin.js'), 'utf8');
const { parseGLB } = new Function('PLUGIN_ASSETS', src + '\nreturn { parseGLB };')({});

function exampleGLB() {
  const P = [], I = [];
  for (const [ax, s] of [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]]) {
    const b = P.length / 3, u = (ax + 1) % 3, v = (ax + 2) % 3;
    for (const [a, c] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const p = [0, 0, 0]; p[ax] = s * 0.5; p[u] = a * 0.5 * s; p[v] = c * 0.5; P.push(...p); }
    I.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const pos = Buffer.from(new Float32Array(P).buffer), idx = Buffer.from(new Uint16Array(I).buffer);
  const bin = Buffer.concat([pos, idx, Buffer.alloc((4 - (idx.length % 4)) % 4)]);
  const json = {
    asset: { version: '2.0', generator: 'glb-check example' }, scene: 0, scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, translation: [0, 1, 0], scale: [2, 2, 2] }], meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: pos.length }, { buffer: 0, byteOffset: pos.length, byteLength: idx.length }],
    accessors: [{ bufferView: 0, componentType: 5126, count: P.length / 3, type: 'VEC3', min: [-0.5, -0.5, -0.5], max: [0.5, 0.5, 0.5] }, { bufferView: 1, componentType: 5123, count: I.length, type: 'SCALAR' }],
  };
  let j = Buffer.from(JSON.stringify(json)); j = Buffer.concat([j, Buffer.alloc((4 - (j.length % 4)) % 4, 0x20)]);
  const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + j.length + 8 + bin.length, 8);
  const ch = (type, data) => { const h = Buffer.alloc(8); h.writeUInt32LE(data.length, 0); h.writeUInt32LE(type, 4); return Buffer.concat([h, data]); };
  return Buffer.concat([head, ch(0x4e4f534a, j), ch(0x004e4942, bin)]);
}

let file = process.argv[2];
if (file === '--example') { file = process.argv[3] || 'example.glb'; writeFileSync(file, exampleGLB()); }
if (!file) { console.error('usage: node glb-check.mjs <file.glb> | --example [out.glb]'); process.exit(2); }
const b = readFileSync(file), m = parseGLB(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
const f = new Float32Array(m.vb), lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
for (let k = 0; k < m.nv; k++) for (let c = 0; c < 3; c++) { lo[c] = Math.min(lo[c], f[k * 4 + c]); hi[c] = Math.max(hi[c], f[k * 4 + c]); }
console.log(`${file}: ${m.nv} vertices, ${m.ib.length / 3} triangles, bounds [${lo.map((v) => v.toFixed(2))}] .. [${hi.map((v) => v.toFixed(2))}] m`);
if (!m.nv || !m.ib.length) process.exit(1);
