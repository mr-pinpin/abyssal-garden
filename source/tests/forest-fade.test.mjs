// Build dev.html with the Garden build before running this test.
// GARDEN_FADE_PAGE can point to another unminified build, such as a mutation.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {exercise} from './built-scene.mjs';

const width = 1440;
const height = 900;
// Desktop DOM layout fixture. The VM harness has no CSS layout engine.
const rectangles = {
  '#chapter-title': {left: 86.4, top: 240, right: 411.4, bottom: 372},
  '#chapter-description': {left: 86.4, top: 396, right: 371.4, bottom: 474},
  '.intro .actions': {left: 86.4, top: 500, right: 411.4, bottom: 542},
};

function instrument(script) {
  // Carry the originating piece into the raster loop and observe triangles
  // that survive the renderer's culling, before depth can hide a regression.
  for (const [marker, replacement] of [
    ['triangles.push({v:', 'triangles.push({pieceName:piece.name,v:'],
    ['let drawn=0;', 'let drawn=0;const drawnPieces=new Map();'],
    ['drawn++;', 'drawn++;drawnPieces.set(t.pieceName,fade);'],
    ['context.putImageData(image,0,0);',
      'inspectFrame(forestState.chapter,triangles,vp,drawnPieces);context.putImageData(image,0,0);'],
  ]) {
    assert.equal(script.split(marker).length, 2, 'Expected one raster hook: '+marker);
    script = script.replace(marker, replacement);
  }
  return script;
}

function treeName(pieceName) {
  return pieceName.replace(/^(.*\/)(?:trunk|canopy)-(\d+)$/, '$1tree-$2');
}

function treeBounds(triangles) {
  const trees = new Map();
  for (const {pieceName, v} of triangles) {
    const name = treeName(pieceName);
    if (name === pieceName) continue;
    if (!trees.has(name)) trees.set(name, [
      [Infinity, Infinity, Infinity], [-Infinity, -Infinity, -Infinity],
    ]);
    const [lower, upper] = trees.get(name);
    for (const vertex of v) {
      vertex.forEach((value, axis) => {
        lower[axis] = Math.min(lower[axis], value);
        upper[axis] = Math.max(upper[axis], value);
      });
    }
  }
  return trees;
}

function screenBounds(matrix, [lower, upper]) {
  const xs = [];
  const ys = [];
  for (const x of [lower[0], upper[0]]) {
    for (const y of [lower[1], upper[1]]) {
      for (const z of [lower[2], upper[2]]) {
        const clip = row => matrix[row]*x + matrix[row+4]*y + matrix[row+8]*z + matrix[row+12];
        const w = clip(3);
        if (w <= 0.1) continue;
        xs.push((1 + clip(0)/w) * width/2);
        ys.push((1 - clip(1)/w) * height/2);
      }
    }
  }
  return {left: Math.min(...xs), right: Math.max(...xs),
    top: Math.min(...ys), bottom: Math.max(...ys)};
}

function overlaps(box, rect) {
  const padding = 14;
  return box.left < rect.right + padding && box.right > rect.left - padding
    && box.top < rect.bottom + padding && box.bottom > rect.top - padding;
}

test('trees crossing the desktop headline, paragraph or actions are faded', async t => {
  const frames = [];
  let bounds;
  await exercise(process.env.GARDEN_FADE_PAGE || 'dev.html', {
    width, height, rectangles, instrument,
    inspectFrame(chapter, triangles, matrix, drawnPieces) {
      bounds ??= treeBounds(triangles);
      frames.push({chapter, matrix, drawnPieces});
    },
  });

  const covered = new Set();
  const violations = new Set();
  const finalFrames = new Map(frames.map(frame => [frame.chapter, frame]));
  assert.deepEqual([...finalFrames.keys()].sort(), ['clearing', 'elder', 'home']);
  for (const frame of frames) {
    const {chapter, matrix, drawnPieces} = frame;
    const protectedTrees = new Map();
    for (const [name, corners] of bounds) {
      const box = screenBounds(matrix, corners);
      const hits = Object.keys(rectangles).filter(selector => overlaps(box, rectangles[selector]));
      if (!hits.length) continue;
      hits.forEach(selector => covered.add(selector));
      protectedTrees.set(name, hits);
    }
    for (const [piece, fade] of drawnPieces) {
      const hits = protectedTrees.get(treeName(piece));
      if (!hits) continue;
      const where = chapter+' '+piece+' ('+hits.join(', ')+')';
      if (fade === 1) violations.add(where+' at full opacity');
      else if (frame === finalFrames.get(chapter)) violations.add(where+' after the fade settled');
    }
  }
  assert.deepEqual([...covered].sort(), Object.keys(rectangles).sort(), 'Every rectangle needs an overlapping tree');
  assert.equal(violations.size, 0, 'Overlapping tree pieces reached rasterization:\n'+
    [...violations].join('\n'));
  t.diagnostic('Checked '+frames.length+' frames across '+[...new Set(frames.map(f => f.chapter))].join(', '));
});
