// landcover-derive: palette classification and the derived channels on a tiny synthetic landcover (no assets read).
import test from 'node:test';
import assert from 'node:assert/strict';
import { derive, classify, decodePNG } from '../tools/landcover-derive.mjs';
import { png } from './png.mjs';

function image(w, h, fill) { const data = new Uint8ClampedArray(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = fill(x, y); data.set([...c, 255], (y * w + x) * 4); } return { width: w, height: h, data }; }

test('nearest palette class survives anti-aliased colours', () => {
  const cls = classify(image(2, 1, (x) => (x ? [250, 8, 4] : [3, 0, 250])));
  assert.deepEqual([...cls], [4, 5]);   // water, path
});

test('derived ground and vegetation channels follow the landcover; shore band is outside water only', () => {
  const img = image(64, 32, (x) => (x < 16 ? [0, 0, 255] : x < 24 ? [153, 153, 0] : x < 32 ? [255, 0, 0] : [0, 102, 0]));
  const { ground, veg } = derive(img, 32, 16), at = (im, x, y, c) => im.data[(y * 32 + x) * 4 + c];
  assert.equal(at(ground, 2, 8, 2), 0, 'no shore band inside the water');
  assert.ok(at(ground, 9, 8, 2) > 100, 'shore band just outside the water');
  assert.ok(at(ground, 14, 8, 0) > 200, 'path channel on the path');
  assert.ok(at(veg, 28, 8, 0) > 200, 'tree density in the woodland');
  assert.ok(at(veg, 10, 8, 2) > 150, 'fern/grass density on the fern band');
});

test('PNG round trip through the stdlib decoder', () => {
  const img = image(5, 3, (x, y) => [x * 40, y * 80, 7]);
  const back = decodePNG(png(img));
  assert.equal(back.width, 5); assert.deepEqual([...back.data.subarray(0, 8)], [0, 0, 7, 255, 40, 0, 7, 255]);
});
