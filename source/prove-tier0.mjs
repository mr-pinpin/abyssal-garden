// Proof that a plugin change rebuilds only that plugin: warm the cache with tier 1, append a comment to
// plugins/<name>/plugin.js (default timber-clearing), run tier 0, check that exactly that unit compiled, restore the file.
//   node prove-tier0.mjs [plugin]
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const active = JSON.parse(readFileSync(path.join(here, 'manifest.json'), 'utf8')).plugins.filter(p => p.enabled !== false);
const name = process.argv[2] || ['timber-clearing', 'ship'].find(n => active.some(p => p.name === n)) || active.find(p => p.name !== 'gltf-loader')?.name;
if (!name) throw new Error('No enabled plugin is available for the tier 0 proof.');
const file = path.join(here, 'plugins', name, 'plugin.js'), orig = readFileSync(file, 'utf8');
let invocation = 0;
// Run the same build module in-process: no extra Node process per proof stage.
const run = async (...args) => {
  const argv = process.argv, log = console.log, lines = [];
  process.argv = [process.execPath, path.join(here, 'build.mjs'), ...args];
  console.log = (...values) => lines.push(values.join(' '));
  try { await import(new URL('./build.mjs?proof=' + invocation++, import.meta.url)); }
  finally { process.argv = argv; console.log = log; }
  return lines.join('\n') + '\n';
};
console.log('$ build t1   (warm the cache)\n' + (await run('t1')).split('\n').slice(-2).join('\n'));
writeFileSync(file, orig + `// touched by prove-tier0 at ${new Date().toISOString()}\n`);
let out;
try { out = await run('t0'); } finally { writeFileSync(file, orig); }
console.log(`$ edit plugins/${name}/plugin.js; build t0\n` + out);
const compiled = out.split('\n').filter((l) => l.includes('COMPILED')).map((l) => l.trim().split(/\s+/)[1]);
await run('t0'); // put the cache back in step with the restored file
if (compiled.length !== 1 || compiled[0] !== `plugin:${name}`) { console.error(`FAIL: compiled ${compiled.join(', ')}`); process.exit(1); }
console.log(`OK: only plugin:${name} was rebuilt`);
