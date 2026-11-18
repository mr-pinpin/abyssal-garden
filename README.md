# Mr. PinPin — the living atlas

A local, interactive forest showcase built on the
[Noniv/abyssal-garden](https://github.com/Noniv/abyssal-garden) fork by
Maksymilian Dendura. Three switchable scenes bring the house, Beaver's timber
clearing, and the Elder's sanctuary together in one small world. Four new
plugins, five real Blender models, raw WebGPU rendering, and a software
compatibility renderer. **This revision is committed locally, not pushed or
deployed. Konev owns the push.** The existing Pages URL may still serve an older
revision.

- **A place called home:** the pinned three-room house plan, green entry,
  moss-roof cutaway, forest trees, ferns, and a path between the scene areas.
- **Timber & teamwork:** PinPin, Beaver in his blue vest, a stationary red timber
  tractor with empty trailer, repaired footbridge, and windfallen tree by water.
- **Beneath the roots:** a root-screened passage, broad stone floor, four story
  mural themes, wall lamps, seed bowl, mat/stool and open book.
- **Forest ambience:** optional procedural wind and bird-like tones. Sound starts
  only after a user gesture and pauses when the page is hidden.

Drag to orbit, scroll to zoom, choose a chapter, or take a gentle tour. Chapter
selection and zoom work in the compatibility renderer too. No navigation wall
separates the scenes. These are **unreviewed showcase interpretations**, not
approved book illustrations, a canonical measured exterior, or animated actors.

## Run and build

From `source/`, with Node 22 and dependencies installed:

```sh
npm ci
npm run t0       # only changed units, assembles ../dev.html
npm run build    # tier 1, builds ../index.html and ../dev.html
npm run prove    # edit/restore an enabled plugin, prove only that unit rebuilds
```

Serve the repository root with a normal static HTTP server. WebGPU requires a
secure context (HTTPS or localhost). The app falls back to a depth-buffered
software renderer when no adapter is available; it uses the same actual model
triangles and colors, not a poster image. WebGPU supplies directional light,
soft distance haze and bounded warm sanctuary illumination; software lighting
is simpler. Static scenes render on demand, not continuously. Tour mode is
optional; the software backend caps its internal frame to 1.8 million pixels.

Local package-registry DNS was unavailable. These checks used an ignored local
symlink to preinstalled **esbuild 0.28.1**. The unchanged dependency lock pins
0.28.2 for normal installation and CI; no dependency downgrade is committed.

## Plugins and models

`source/manifest.json` registers pre-phase plugins and the five asset URLs.
Each plugin can be independently set to `"enabled": false`; definitions are
omitted, the core guards calls, and the corresponding chapter/sound control
becomes unavailable. Disabled clearing means no model requests. Material-color
groups are preserved by the existing `gltf-loader`, while retaining its original
`{vb, ib, nv}` layout and procedural fallback behavior.

| Plugin | Entry point |
| --- | --- |
| `pinpin-home` | `pinpinHomePieces()` |
| `timber-clearing` | `pinpinClearingPieces()` |
| `elder-sanctuary` | `pinpinElderPieces()` |
| `forest-ambience` | `pinpinCreateAmbience()` |

The descriptor contract is `{name, asset, build, position, rotation, scale,
color}`. Positions are world XYZ, ground y=0, rotations radians, scales positive,
and `build()` returns packed Mesh buffers. The GLBs are in `assets/pinpin/`, each
under 2 MB. `assets/pinpin/manifest.json` preserves byte hashes, source script,
canon evidence and generation commit. The source scripts and turntables remain
in the separate asset repository at generation commit
`8978b223db3b5bd1ae07c0fd16aec54b14056cb8`.

The original underwater engine, plugins, template and upstream MIT notices are
retained. To restore the original preset locally, copy
`source/manifest.underwater.json` over `source/manifest.json` and rebuild; retain
the forest manifest separately if planning to switch back. The tier-0 proof
selects an enabled plugin in either preset. Deployment still uses the existing
GitHub Pages workflow; it builds before packaging `index.html`, `dev.html`,
`assets/`, and version/manifest metadata. This worker did not push.

## Exact verification and limits

From the repository root:

```sh
node --test source/tests/loader.test.mjs source/plugins/pinpin-home/contract.test.mjs source/plugins/elder-sanctuary/contract.test.mjs
python3 source/tests/check-builds.py
node source/tests/built-scene.mjs /tmp/pinpin-built-final
npm --prefix source run prove
```

- Mesh tests check finite geometry/transforms, indices, triangle area, sensible
  bounds, deterministic buffers, unchanged shared RNG, canonical floor areas,
  wall-height bounds, and sampled traversal rays.
- Loader tests verify all five real GLBs against recorded hashes, preserve their
  material colors, validate packed buffers/groups, and inject a missing model.
- `check-builds.py` compiles **each of the four new plugins alone** through tier 0,
  disables each in turn, builds tier 1, executes that built artifact, and restores
  the manifest. Results are in `source/tests/build-evidence.json`.
- `built-scene.mjs` executes the **actual minified script from index.html** with an
  explicit DOM/Canvas adapter and filesystem-backed fetch. The actual loader
  reads and parses all five model files; all report `loaded:true`. It exercises
  chapter changes at desktop and 390×844 sizes, captures the actual software
  renderer's pixel buffers, verifies no idle animation callbacks remain, and
  injects a missing PinPin file: the interface reports four studies and fallback
  shapes. Output PNGs and detailed evidence are written to the supplied folder.

**Browser/CSS layout, WebGPU shader compilation and hardware rendering remain
unverified in this sandbox.** A localhost server failed with socket `EPERM`, and
Chrome exited on its socket permission check. The DOM adapter is not a browser,
and its successful resource statuses come from local file reads, not HTTP.
The generated compatibility frames were visually inspected; they are not browser
screenshots. Before public deployment, Konev should serve this build in a normal
browser and check desktop/mobile layout, WebGPU, camera controls and sound.

## Canon and content rights

The read-only canon was `/home/cloudroom-agent/showcase/canon`; it was never
edited. Each scene's README and provenance file cites exact source paths/facts,
distinguishing plan geometry from new spatial staging. PinPin follows the
neutral hedgehog reference, the clearing follows `timber-tractor.json`, and the
sanctuary follows `elder-elder-house.json` and `elder-beneath-roots.json`.

Original engine software remains under the upstream `LICENSE`. Stories, models,
world-specific geometry and creative configuration are **not** blanket MIT.
Preserved canon notices are under the home/Elder plugins and
`assets/pinpin/notices/`; no new third-party rights or approved-canon status is
claimed. No external images, texture downloads, book artwork, or unlicensed GPU
subtree was copied into the forest renderer.
