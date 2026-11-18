import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const math = readFileSync(path.join(root, 'source/core/math.js'), 'utf8');
const plugin = readFileSync(path.join(root, 'source/plugins/pinpin-character/plugin.js'), 'utf8');
const loader = readFileSync(path.join(root, 'source/plugins/gltf-loader/plugin.js'), 'utf8');
const factory = new Function(math + '\n' + plugin + '\nreturn {pieces: pinpinCharacterPieces, seed: () => _seed};')();
const manifest = JSON.parse(readFileSync(path.join(root, 'assets/recovered/assets.json')));
const expected = ['pinpin', 'beaver', 'timber-tractor', 'footbridge', 'windfallen-tree'];
const bytes = id => {
  const b = readFileSync(path.join(root, 'assets/recovered', id + '.glb'));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
};
const parse = new Function('PLUGIN_ASSETS', loader + '\nreturn parseGLB;')({});

function inspect(mesh) {
  assert(mesh.vb instanceof ArrayBuffer);
  assert(mesh.ib instanceof Uint32Array);
  assert(Number.isInteger(mesh.nv) && mesh.nv > 0 && mesh.nv < 100000);
  assert.equal(mesh.vb.byteLength, mesh.nv * 16);
  assert(mesh.ib.length > 0 && mesh.ib.length % 3 === 0);
  const p = new Float32Array(mesh.vb), packed = new Int8Array(mesh.vb);
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < mesh.nv; i++) {
    for (let c = 0; c < 3; c++) {
      const v = p[i * 4 + c];
      assert(Number.isFinite(v));
      lo[c] = Math.min(lo[c], v); hi[c] = Math.max(hi[c], v);
    }
    assert(Math.hypot(...packed.slice(i * 16 + 12, i * 16 + 15)) > 100, 'valid normalized vertex normal');
  }
  assert(mesh.ib.every(i => i < mesh.nv));
  // Both imported and procedural objects remain small, grounded props, not world-filling meshes.
  assert(lo[1] >= -0.03 && lo[1] < 0.2, 'ground-level feet/base');
  assert(hi[1] > 0.5 && hi[1] < 3.1);
  assert(lo.every(v => v > -5) && hi.every(v => v < 5));
  assert(hi.every((v, c) => v - lo[c] > 0.1));
  return {vertices: mesh.nv, triangles: mesh.ib.length / 3, lo, hi};
}

test('pure descriptors cover all five asset keys with explicit separated placement', () => {
  const before = factory.seed(), pieces = factory.pieces();
  assert.deepEqual(pieces.map(p => p.name), expected);
  assert.deepEqual(pieces.map(p => p.asset), expected);
  assert.deepEqual(pieces[0].position, [0, 0, 4]);
  for (const p of pieces) {
    for (const field of ['position', 'rotation', 'scale', 'color']) {
      assert.equal(p[field].length, 3); assert(p[field].every(Number.isFinite));
    }
    assert(p.color.every(v => v >= 0 && v <= 1));
    assert(p.scale.every(v => v > 0));
    // A central, 3 m wide approach remains clear for camera navigation.
    if (p.name !== 'pinpin') assert(Math.abs(p.position[0]) >= 4.5);
    p.build();
  }
  assert.equal(factory.seed(), before, 'plugin does not perturb core random stream');
});

for (const id of expected) {
  test(id + ': finite, indexed, bounded and deterministic fallback; real GLB parses', () => {
    const piece = factory.pieces().find(p => p.name === id), a = piece.build();
    const b = factory.pieces().find(p => p.name === id).build();
    assert(inspect(a).lo[1] >= -1e-6, 'fallback base must be on ground');
    assert.deepEqual(Buffer.from(a.vb), Buffer.from(b.vb));
    assert.deepEqual(a.ib, b.ib);
    const imported = parse(bytes(id));
    inspect(imported);
    console.log(id, JSON.stringify({fallback: inspect(a), imported: inspect(imported)}));
  });
}

test('PinPin fallback has four separated ground-contact paws, face and layered quills', () => {
  const mesh = factory.pieces()[0].build(), p = new Float32Array(mesh.vb);
  const contacts = new Set(); let snout = false, crown = false;
  for (let i = 0; i < mesh.nv; i++) {
    const x = p[i * 4], y = p[i * 4 + 1], z = p[i * 4 + 2];
    if (y < 0.025) contacts.add((x > 0 ? 'fore' : 'hind') + (z > 0 ? 'left' : 'right'));
    if (x > 1.1 && y > 0.5) snout = true;
    if (x < 0.3 && y > 1.35) crown = true;
  }
  assert.equal(contacts.size, 4); assert(snout); assert(crown);
});

for (const id of expected) {
  test(id + ': existing setPiece loads GLB or falls back for missing/404/corrupt assets', async () => {
    const piece = factory.pieces().find(p => p.name === id);
    for (const mode of ['unconfigured', '404', 'corrupt', 'ok']) {
      let builds = 0, fetches = 0; const warnings = [];
      const assets = mode === 'unconfigured' ? {} : {[id]: {url: 'assets/recovered/' + id + '.glb'}};
      const fetch = async url => {
        fetches++; assert.equal(url, assets[id].url);
        return {ok: mode !== '404', status: mode === '404' ? 404 : 200,
          arrayBuffer: async () => mode === 'corrupt' ? new ArrayBuffer(24) : bytes(id)};
      };
      const setPiece = new Function('PLUGIN_ASSETS', 'fetch', 'console', loader + '\nreturn setPiece;')(
        assets, fetch, {info() {}, warn(message) { warnings.push(message); }});
      const mesh = await setPiece(id, () => { builds++; return piece.build(); });
      inspect(mesh);
      assert.equal(builds, mode === 'ok' ? 0 : 1);
      assert.equal(fetches, mode === 'unconfigured' ? 0 : 1);
      assert.equal(warnings.length, ['404', 'corrupt'].includes(mode) ? 1 : 0);
    }
  });
}

test('turntables and GLBs retain the manifest identity and material limitations are detectable', () => {
  assert.deepEqual(manifest.assets.map(a => a.id), expected);
  for (const id of expected) {
    const raw = bytes(id), dv = new DataView(raw), size = dv.getUint32(12, true);
    const gltf = JSON.parse(new TextDecoder().decode(new Uint8Array(raw, 20, size)));
    assert(gltf.materials.length > 1, 'original has multiple material colors');
    assert.equal(parse(raw).colors, undefined, 'existing loader strips material colors: handoff limitation');
  }
});
