import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const entryPoints = new Map([
  ['fluke', 'meshFluke'],
  ['ship', 'meshShip'],
  ['manta', 'meshManta'],
  ['fish', 'meshFish'],
  ['audio', 'mute'],
  ['timber-clearing', 'pinpinClearingPieces'],
  ['forest-ambience', 'pinpinCreateAmbience'],
]);

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
const names = process.env.GARDEN_TEST_PLUGIN
  ? [process.env.GARDEN_TEST_PLUGIN]
  : [...entryPoints.keys(), 'dev-tools'];

for (const name of names) {
  test(`${name} loads and exposes its scene hook`, async () => {
    const code = read(`../plugins/${name}/plugin.js`);
    const context = {};
    let hook;
    if (name === 'dev-tools') {
      const render = () => {};
      context.render = render;
      context.addEventListener = (event, listener) => {
        assert.equal(event, 'keydown');
        hook = listener;
      };
      await runInNewContext(`(async () => {\n${code}\n})()`, context, { timeout: 3000 });
      assert.equal(typeof hook, 'function');
      assert.equal(typeof context.render, 'function');
      assert.notEqual(context.render, render);
      return;
    }
    const entryPoint = entryPoints.get(name);
    assert.ok(entryPoint, `Add a load check or contract.test.mjs for ${name}`);
    const events = [];
    if (name === 'audio') {
      context.document = { addEventListener: (event) => events.push(event) };
    }
    hook = await runInNewContext(`(async () => {\n${code}\nreturn ${entryPoint};\n})()`, context, { timeout: 3000 });
    assert.equal(typeof hook, 'function');
    if (name === 'audio') assert.deepEqual(events, ['visibilitychange']);
  });
}
