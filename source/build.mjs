// Tiered build of the garden: a core plus plugins, listed in manifest.json, all sharing one scope.
//
//   node build.mjs t0 [unit...]   tier 0: compile only the units whose source changed (or the named ones) into
//                                 .cache/, then assemble ../dev.html from the cache. Seconds, usually milliseconds.
//   node build.mjs watch          tier 0 on every save under core/, plugins/ or manifest.json
//   node build.mjs t1             tier 1: the full bundle. Every unit through the same cache, then one minify of
//                                 the whole into ../index.html (single self-contained file), plus ../dev.html.
//   tier 2 is .github/workflows/pages.yml: on push to main it runs tier 1 and deploys to GitHub Pages.
//
// A unit is core/<name>.js or plugins/<name>/plugin.js. Compiling a unit = checking its syntax on its own (errors
// name the plugin and its line) and shrinking the WGSL in its /*wgsl*/ literals. The cache key is the unit's
// source hash, so editing plugins/ship/plugin.js recompiles exactly one unit.
import { readFileSync, writeFileSync, mkdirSync, existsSync, watch } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync, version as esbuildVersion } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(here, '.cache');
const COMPILER = 'unit-v1/' + esbuildVersion; // bump to invalidate every cached unit
const now = () => performance.now();

function manifest() {
  const m = JSON.parse(readFileSync(path.join(here, 'manifest.json'), 'utf8'));
  const unit = (kind, name, extra = {}) => ({ id: `${kind}:${name}`, name, kind, file: kind === 'core' ? `core/${name}.js` : `plugins/${name}/plugin.js`, ...extra });
  const pre = m.plugins.filter((p) => p.phase === 'pre' && p.enabled !== false), post = m.plugins.filter((p) => p.phase === 'post' && p.enabled !== false);
  return [
    ...m.core.map((n) => unit('core', n)),
    // generated from manifest.json: the asset table the gltf-loader plugin reads
    { id: 'gen:assets', name: 'assets', kind: 'gen', source: `const PLUGIN_ASSETS = ${JSON.stringify(m.assets || {})};\n` },
    ...pre.map((p) => unit('plugin', p.name, { dev: !!p.dev })),
    unit('core', m.main),
    ...post.map((p) => unit('plugin', p.name, { dev: !!p.dev })),
  ];
}

const minWgsl = (s) => s.replace(/\/\/[^\n]*/g, '').replace(/\s+/g, ' ').replace(/ ?([{}()\[\];,:=+\-*\/<>&|!%@]) ?/g, '$1').trim();

function compileUnit(u, src) {
  // a unit is a fragment of one async function body: check it as one, so top-level await is allowed
  try { transformSync(`(async()=>{\n${src}\n})`, { loader: 'js', target: 'es2022' }); }
  catch (e) {
    const m = e.errors?.[0];
    throw new Error(`${u.file || u.id}:${m?.location ? m.location.line - 1 : '?'}: ${m?.text || e.message}`);
  }
  const banner = `// ---- ${u.id}\n`;
  return { readable: banner + src, packed: src.replace(/\/\*wgsl\*\/`([^`]*)`/g, (_, w) => '`' + minWgsl(w) + '`') };
}

// tier 0 core: bring every unit's cache entry up to date, compiling only what changed (or what `force` names)
function refresh(units, force = []) {
  mkdirSync(CACHE, { recursive: true });
  const rows = [], out = [];
  for (const u of units) {
    const t = now();
    const src = u.source ?? readFileSync(path.join(here, u.file), 'utf8');
    const key = createHash('sha256').update(COMPILER).update('\0').update(src).digest('hex').slice(0, 16);
    const cf = path.join(CACHE, u.id.replace(':', '__') + '.json');
    let c = existsSync(cf) ? JSON.parse(readFileSync(cf, 'utf8')) : null, state = 'cached';
    if (!c || c.key !== key || force.includes(u.name)) {
      c = { key, ...compileUnit(u, src) };
      writeFileSync(cf, JSON.stringify(c));
      state = 'compiled';
    }
    rows.push({ unit: u.id, state, ms: now() - t });
    out.push({ ...u, ...c });
  }
  return { rows, out };
}

const tpl = () => {
  const config = JSON.parse(readFileSync(path.join(here, 'manifest.json'), 'utf8'));
  return readFileSync(path.join(here, config.template || 'core/template.html'), 'utf8');
};
// everything runs inside one async function; startup errors are shown on screen
const wrap = (body) => `(async()=>{${body}\n})().catch(e=>{console.error(e);document.body.className='l e';const status=document.getElementById('error')||document.getElementById('s');if(status){status.hidden=false;status.textContent=(e.cause?'':'Failed to start: ')+e.message;}if(window.__pinpin)window.__pinpin.errors.push(String(e))});`;
const write = (name, html) => {
  writeFileSync(path.join(here, '..', name), html);
  const gz = gzipSync(Buffer.from(html), { level: 9 }).length;
  return `${name} ${(html.length / 1024).toFixed(1)} kB (${(gz / 1024).toFixed(1)} kB gz)`;
};
const assembleDev = (out) => write('dev.html', tpl().replace('/*SCRIPT*/', () => wrap(out.map((u) => u.readable).join('\n'))));
function assembleProd(out) {
  const js = out.filter((u) => !u.dev).map((u) => u.packed).join('\n');
  const code = transformSync(wrap(js), { minify: true, target: 'es2022', legalComments: 'none' }).code.trim();
  const css = (_, s) => '<style>' + transformSync(s, { loader: 'css', minify: true }).code.trim();
  const html = tpl().replace(/<style>([^]*?)(?=<\/style>)/, css).replace(/>\s+</g, '><').replace('/*SCRIPT*/', () => code).replace(/<script>\s+/, '<script>').replace(/\s+<\/script>/, '</script>');
  return write('index.html', html);
}

function report(tier, rows, extra, t0) {
  const compiled = rows.filter((r) => r.state === 'compiled');
  for (const r of rows) console.log(`  ${r.state === 'compiled' ? 'COMPILED' : 'cached  '} ${r.unit.padEnd(20)} ${r.ms.toFixed(1).padStart(7)} ms`);
  for (const e of extra) console.log(`  -> ${e}`);
  console.log(`${tier}: ${compiled.length}/${rows.length} units compiled (${compiled.map((r) => r.unit).join(', ') || 'none'}), total ${(now() - t0).toFixed(0)} ms`);
}

function tier0(force = []) {
  const t0 = now(), { rows, out } = refresh(manifest(), force), t = now();
  const dev = assembleDev(out);
  report('tier 0', rows, [`${dev}, assembled in ${(now() - t).toFixed(1)} ms`], t0);
}
function tier1() {
  const t0 = now(), { rows, out } = refresh(manifest()), t = now();
  const prod = assembleProd(out), t2 = now(), dev = assembleDev(out);
  report('tier 1', rows, [`${prod}, minified in ${(t2 - t).toFixed(0)} ms`, `${dev}`], t0);
}

const [cmd = 't1', ...args] = process.argv.slice(2);
try {
  if (cmd === 't0') tier0(args);
  else if (cmd === 't1') tier1();
  else if (cmd === 'watch') {
    tier0();
    let timer;
    const kick = () => { clearTimeout(timer); timer = setTimeout(() => { try { tier0(); } catch (e) { console.error('tier 0 failed:', e.message); } }, 60); };
    for (const d of ['core', 'plugins']) watch(path.join(here, d), { recursive: true }, kick);
    watch(path.join(here, 'manifest.json'), kick);
    console.log('watching core/, plugins/, manifest.json: serve the repo root and open dev.html');
  } else throw new Error(`unknown command ${cmd}: use t0 [unit...], t1 or watch`);
} catch (e) { console.error(e.message); process.exit(1); }
