# PinPin and the woodland workshop

This pre-phase plugin defines `pinpinCharacterPieces()`. It has no load-time
DOM, GPU, network, registration, or random-stream side effects. It returns five
independent descriptors for the rendezvous renderer. Every descriptor has
`name`, `asset`, `build`, `position`, `rotation`, `scale`, and `color`.
`build()` returns the existing 16-byte vertex layout `{vb, ib, nv}`.

| Name / asset key | Position (m) | Fallback |
| --- | --- | --- |
| `pinpin` | `[0, 0, 4]` | Young quadruped hedgehog, four separated paws, rounded ears, muzzle, sclera/iris/pupil surfaces and layered spines |
| `beaver` | `[-4.5, 0, 0]` | Upright beaver with broad flat tail, vest silhouette, short legs and paired incisors |
| `timber-tractor` | `[-7, 0.02, -3]` | Stationary tractor, two seats, empty trailer, folded crane and grapple |
| `footbridge` | `[5, 0, -7]` | Planked deck, rails and the last short small-paw approach plank |
| `windfallen-tree` | `[9, 0, -3]` | Fallen trunk with roots and branches beside two woodland trees |

All coordinates are Y-up. Geometry is grounded at approximately zero; the
tractor's +0.02 m position compensates for the recovered GLB's −0.0175 m minimum.
The windfall fallback normalizes its base to zero after building the sloping roots.
PinPin and the beaver face +X before their descriptor Y rotations. Placements,
scales and the grouping into one woodland workshop are authored showcase choices,
not surveyed book geography. The broad central route remains open between props;
actual navigation/collision integration belongs to rendezvous.

## Canon and provenance

Read-only source: `/home/cloudroom-agent/showcase/canon`, repository
`mr-pinpin/mr-pinpin-source`. Asset manifest canon revision:
`f79e64f1584ffbadf09dac12ab90475722fef745`.

- `docs/storyboard/models/pinpin-v1/reference.md`: a young natural quadruped
  hedgehog, four separate short legs, cream muzzle, brown irises with white
  sclera, rounded ears and layered brown spines. No accessories or pedestal.
- `docs/storyboard/stories/timber-tractor.json`, scene-03: chestnut beaver in a
  blue work vest beside a red tractor with an empty trailer.
- Same story, scene-04: windfallen tree beside a stream among standing trees;
  scenes 05–08 establish the passenger seat, crane and grapple.
- Same story, scenes 12–14: repaired footbridge and the final short approach
  plank that makes crossing safe for PinPin's paws.

The imported manifest records exact reference hashes. Both source references
in this readable canon match those recorded SHA-256s. Asset recovery preserves
all five original GLBs, all five turntables, the exact original manifest and
notices; see `assets/recovered/recovery.json`. No canon files or source asset
repository files were edited. These studies and fallback interpretations have
not been approved as book art.

Visual inspection of every original turntable confirmed the depicted forms:
PinPin's separate paws and spine-covered back; beaver's vest, flat tail and
incisors; tractor's seats, empty trailer and folded crane; bridge planks and
rails; fallen tree, stream base and standing trees. These are source previews,
not screenshots of an integrated browser scene.

## Integration contract and limits

Register `{ "name": "pinpin-character", "phase": "pre", "enabled": true }`
in `source/manifest.json` after the loader, then have the renderer call
`pinpinCharacterPieces()`. For each descriptor, call
`await setPiece(piece.asset, piece.build)` and apply its position, XYZ rotation,
XYZ scale and RGB tint. Map the five exact asset IDs in the manifest, e.g.:

```json
"pinpin": { "url": "assets/recovered/pinpin.glb" }
```

Use equivalent mappings for `beaver`, `timber-tractor`, `footbridge`, and
`windfallen-tree`. Omitting an asset mapping or a failed/corrupt fetch invokes
its procedural fallback. Setting the plugin's `enabled` to false removes the
function entirely; consumers must guard calls with `typeof` or their registry.
No registration or renderer changes are included in this worker commit.

**Material limitation:** the existing `gltf-loader` merges primitives into
position/normal/aux buffers and drops material indices, PBR colors, textures and
vertex colors. Every recovered GLB has multiple materials, so the previews'
full palette will not survive this parser. The descriptors supply one base tint
per whole piece; they cannot reproduce a blue vest and brown body simultaneously.
Fallback vertex `aux` holds tonal variation, but its visual use depends on the
rendezvous renderer. A per-vertex color stream or primitive material handling
must be added there for palette fidelity. This worker did not modify the loader.
The parser is for static triangles, not animated rigs; none of these GLBs needs
external textures or animation. Renderer integration and browser navigation/
visual verification remain explicit rendezvous tasks.

## Reproduce validation

From the garden root:

```sh
python3 source/plugins/pinpin-character/recover.py
node source/plugins/pinpin-character/test.mjs
python3 source/plugins/pinpin-character/tier0-check.py
```

The 13 direct Node tests verify all five finite deterministic indexed meshes,
ground-level bases and bounded dimensions, four PinPin paw contacts, isolated
random state, the real GLBs, and existing `setPiece` behavior for unconfigured,
404, corrupt and successful assets. Use the direct Node command above: this
sandbox's `node --test` runner reports a file-level wrapper rather than the
individual test details. Full direct-test output is in `evidence/tests.tap`.

The Python tier-0 proof temporarily registers this plugin in the base manifest,
warms the cache, appends one proof comment, and asserts that exactly
`plugin:pinpin-character` recompiles. It then verifies `enabled:false` omits the
function, and restores both files and the generated dev page in `finally`.
It changes no tracked shared files. Run it against the pre-integration manifest;
after permanent registration, adapt its setup in the rendezvous verification.
`evidence/tier0.txt` records **1/14 units compiled**, then **0/13** on disable.
`evidence/recovery.txt` records parser counts and bounds.

### Build environment

`npm ci --prefix source --cache /tmp/forest-npm-cache --ignore-scripts --no-audit --no-fund`
could not reach npm (`EAI_AGAIN`, DNS). The pinned lockfile requests esbuild
0.28.2. Compilation proof used the available **0.28.1** instead, through an
ignored local dependency symlink (not committed):

```sh
mkdir -p source/node_modules
ln -s /opt/cloudroom-gui/gui/node_modules/.pnpm/esbuild@0.28.1/node_modules/esbuild source/node_modules/esbuild
python3 source/plugins/pinpin-character/tier0-check.py
```

No package or lockfile changes were made. Rerun tier 0 and tier 1 with the pinned
dependency in the publishing environment. Python drives the proof because this
sandbox rejected Node's nested `spawnSync /usr/bin/node` with EPERM; normal
Python-launched npm/Node builds succeed. This environmental workaround is not
a claim that 0.28.2 was tested, nor a blocker to the verified local compilation.
