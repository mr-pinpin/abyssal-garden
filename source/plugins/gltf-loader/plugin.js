// ============================================================================
// plugin: gltf-loader - set pieces from Blender (glTF 2.0 binary, .glb) in assets/
// ============================================================================
// manifest.json "assets" maps a set piece name (fluke, ship, manta, fish) to a .glb exported from Blender:
//   "ship": { "url": "assets/ship.glb", "scale": 1, "offset": [0, 0, 0] }
// The renderer asks setPiece(name, procedural) for each set piece. With an asset listed it is fetched and turned
// into the renderer's 16-byte vertex (float32 xyz, int8 normal xyz, int8 aux); without one, or if loading fails,
// the procedural mesh is used, so the original garden is always the fallback.
// Blender export: File > Export > glTF 2.0, format "glTF Binary (.glb)", +Y up, Apply Modifiers. Every triangle
// primitive in the default scene is merged, with node transforms baked in.
function glbMul(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; }
  return o;
}
function glbNodeMatrix(n) {
  if (n.matrix) return Float32Array.from(n.matrix);
  const [x, y, z, w] = n.rotation || [0, 0, 0, 1], [sx, sy, sz] = n.scale || [1, 1, 1], [tx, ty, tz] = n.translation || [0, 0, 0];
  return Float32Array.of(
    (1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0,
    2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
    2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
    tx, ty, tz, 1);
}
// GLB bytes -> { vb, ib, nv } in the renderer's vertex layout
function parseGLB(ab, opt = {}) {
  const dv = new DataView(ab);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('not a .glb file');
  let json, bin, o = 12;
  while (o < dv.byteLength) {
    const len = dv.getUint32(o, true), type = dv.getUint32(o + 4, true);
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(new Uint8Array(ab, o + 8, len)));
    else if (type === 0x004e4942) bin = new Uint8Array(ab, o + 8, len);
    o += 8 + len;
  }
  const acc = (i) => {
    const a = json.accessors[i], v = json.bufferViews[a.bufferView];
    const C = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array }[a.componentType];
    const n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type], stride = v.byteStride ? v.byteStride / C.BYTES_PER_ELEMENT : n;
    const start = bin.byteOffset + (v.byteOffset || 0) + (a.byteOffset || 0);
    const raw = new C(bin.buffer.slice(start, start + ((a.count - 1) * stride + n) * C.BYTES_PER_ELEMENT)), out = new C(a.count * n);
    for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) out[k * n + c] = raw[k * stride + c];
    return out;
  };
  const P = [], Nn = [], I = [], sc = opt.scale || 1, off = opt.offset || [0, 0, 0];
  const walk = (ni, parent) => {
    const node = json.nodes[ni], M = glbMul(parent, glbNodeMatrix(node));
    if (node.mesh !== undefined) for (const pr of json.meshes[node.mesh].primitives) {
      if ((pr.mode ?? 4) !== 4) continue;
      const pos = acc(pr.attributes.POSITION), nrm = pr.attributes.NORMAL !== undefined ? acc(pr.attributes.NORMAL) : null, base = P.length / 3;
      for (let k = 0; k < pos.length; k += 3) {
        const x = pos[k], y = pos[k + 1], z = pos[k + 2];
        P.push((M[0] * x + M[4] * y + M[8] * z + M[12]) * sc + off[0], (M[1] * x + M[5] * y + M[9] * z + M[13]) * sc + off[1], (M[2] * x + M[6] * y + M[10] * z + M[14]) * sc + off[2]);
        if (nrm) { const a = nrm[k], b = nrm[k + 1], c = nrm[k + 2]; Nn.push(M[0] * a + M[4] * b + M[8] * c, M[1] * a + M[5] * b + M[9] * c, M[2] * a + M[6] * b + M[10] * c); }
        else Nn.push(0, 0, 0);
      }
      const idx = pr.indices !== undefined ? acc(pr.indices) : Uint32Array.from({ length: pos.length / 3 }, (_, i) => i);
      for (const i of idx) I.push(base + i);
    }
    for (const c of node.children || []) walk(c, M);
  };
  const ident = Float32Array.of(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  const roots = json.scenes ? json.scenes[json.scene || 0].nodes : json.nodes.map((_, i) => i);
  for (const ni of roots) walk(ni, ident);
  // vertices that came without a normal get their face normals summed, as Mesh.build does
  const had = Nn.map((v) => v !== 0);
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const k of [a, b, c]) if (!(had[k] || had[k + 1] || had[k + 2])) { Nn[k] += nx; Nn[k + 1] += ny; Nn[k + 2] += nz; }
  }
  const nv = P.length / 3, vb = new ArrayBuffer(nv * 16), f = new Float32Array(vb), s = new Int8Array(vb);
  for (let k = 0; k < nv; k++) {
    const nx = Nn[k * 3], ny = Nn[k * 3 + 1], nz = Nn[k * 3 + 2], l = Math.hypot(nx, ny, nz) || 1;
    f[k * 4] = P[k * 3]; f[k * 4 + 1] = P[k * 3 + 1]; f[k * 4 + 2] = P[k * 3 + 2];
    s[k * 16 + 12] = Math.round(nx / l * 127); s[k * 16 + 13] = Math.round(ny / l * 127); s[k * 16 + 14] = Math.round(nz / l * 127);
    s[k * 16 + 15] = opt.aux ?? 0;
  }
  return { vb, ib: Uint32Array.from(I), nv };
}
// the renderer calls this for every set piece; `procedural` builds the original mesh
async function setPiece(name, procedural) {
  const a = PLUGIN_ASSETS[name];
  if (a) try {
    const r = await fetch(a.url);
    if (!r.ok) throw new Error(r.status + ' ' + a.url);
    const m = parseGLB(await r.arrayBuffer(), a);
    console.info(`[gltf-loader] ${name}: ${a.url}, ${m.nv} vertices, ${m.ib.length / 3} triangles`);
    return m;
  } catch (e) { console.warn(`[gltf-loader] ${name}: ${e.message}; using the procedural mesh`); }
  return procedural();
}
