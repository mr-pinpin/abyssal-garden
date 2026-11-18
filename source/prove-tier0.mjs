// Proof that a plugin change rebuilds only that plugin: warm the cache with tier 1, append a comment to
// plugins/<name>/plugin.js (default ship), run tier 0, check that exactly that unit compiled, restore the file.
//   node prove-tier0.mjs [plugin]
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), name = process.argv[2] || 'ship';
const file = path.join(here, 'plugins', name, 'plugin.js'), orig = readFileSync(file, 'utf8');
const run = (...a) => execFileSync(process.execPath, [path.join(here, 'build.mjs'), ...a], { encoding: 'utf8' });
console.log('$ build t1   (warm the cache)\n' + run('t1').split('\n').slice(-2).join('\n'));
writeFileSync(file, orig + `// touched by prove-tier0 at ${new Date().toISOString()}\n`);
let out;
try { out = run('t0'); } finally { writeFileSync(file, orig); }
console.log(`$ edit plugins/${name}/plugin.js; build t0\n` + out);
const compiled = out.split('\n').filter((l) => l.includes('COMPILED')).map((l) => l.trim().split(/\s+/)[1]);
run('t0'); // put the cache back in step with the restored file
if (compiled.length !== 1 || compiled[0] !== `plugin:${name}`) { console.error(`FAIL: compiled ${compiled.join(', ')}`); process.exit(1); }
console.log(`OK: only plugin:${name} was rebuilt`);
