# Elder sanctuary beneath roots — unreviewed showcase study

`pinpinElderPieces()` is a standalone pre-phase plugin sharing the existing
Mesh/math scope. It returns 56 procedural piece descriptors at `[14,0,-16]`:
a broad stone floor, rear/side cave rocks, three tall root vaults, a root passage,
mat/stool/reading desk props, four mural stations with fixed lamp geometry, and
a seed bowl beneath the Mother of Life. Helpers are private; definition has no
DOM, GPU, fetch or registration effects and builds never touch the shared RNG.
Every `asset` is `null`; no binary asset is needed, imported, or modified.

## Exact story evidence

Paths are relative to read-only `/home/cloudroom-agent/showcase/canon`.
`provenance.json` records the source file SHA-256 values.

| Canon file and scene IDs | Fact followed |
| --- | --- |
| `docs/storyboard/stories/elder-elder-house.json`, `elder-r6-mentor-001`, `007`, `009`, `013`–`018` | Arrival stone, sunny resting place beside roots/fern/mossy rock, root doorway; books, ink-stained table, little footstool and open book. |
| `docs/storyboard/stories/elder-beneath-roots.json`, `elder-r6-mentor-038`–`049` | Small woven mat and stool by a root gap; rolled mat remains outside; pale roots and pale stone guide a gently sloping passage. |
| Same file, `050`–`052`, `058`–`065` | Broad stone floor and high cave; human sacred paintings, fixed wall lamps, Mother of Life with expectant belly, baby/cradle, growing shoots, real seeds left beneath the painting. |
| Same file, `066`–`069` | Shield Keeper protects little homes/families from harm and storm. |
| Same file, `070`–`072` | Sunlight and a living tree oppose cold storm; ordinary peaceful night is explicitly not the threat. |
| Same file, `073`–`075` | Shared-work animals carry timber, bring food and hold little ones. |
| Same file, `077`–`089` | Natural route back, pale stone/split root, restored mat and stool, open book and offer to learn reading/writing. |

The story establishes an underground space reached by a low, sloping root
passage. This plugin raises that space into a **ground-level cutaway** to make
its staging inspectable in the shared forest. It does not claim a canonical
measured floorplan, topographic survey, exact mural style, or final illustration.
Dimensions, compass orientation, relative placement, palette, number/form of
visible roots, and relative positions of the four stations are authored.
The geometric relief motifs are new restrained studies of the story themes,
not copies of the approved sacred images. The characters themselves belong to
other scene pieces; these plugins introduce no substitute Elder/PinPin actors.

The path from the home arrives near `[14,0,-7]` at the root-screened passage.
Arches, not filled disks, lead to the broad sanctuary floor. Rear and short side
walls leave the front and central route open; there is no cross-forest solid
wall. Root vaults sit overhead, with seed bowl and lamps away from the center.
The real lamps are represented as colored geometry: the shared renderer owns
lighting, emissive treatment, ambience and interaction. The roots' lower tips
may touch slightly below the y=0 ground; each piece's local base is normalized
to y=0 and its descriptor position retains the intended placement.

## Checks and integration

Run from repository root:

```sh
node --test source/plugins/elder-sanctuary/contract.test.mjs
python3 source/plugins/elder-sanctuary/tier0-check.py
```

Tests check finite positions/transforms, unique names, colors/scales, packed
Mesh buffers, triangle indices, nonzero area, bounded substantial geometry,
local base y=0, byte-deterministic builds across fresh contexts, unchanged shared
RNG, four mural stations/lamps and story props, and triangle/ray clearance through
the passage and central sanctuary at two heights and three lateral positions.
These sampled routes are not a full navigation/collision proof.

The tier-0 check temporarily adds this plugin alone alongside original plugins,
runs `npm run t0 -- elder-sanctuary`, verifies exactly one new unit compiled, confirms a cached repeat and
`enabled:false` omission, then restores the shared manifest byte-for-byte.
`tier0-evidence.txt` contains the observed output. Offline package-registry
failure meant the check used preinstalled esbuild **0.28.1**, not the lockfile's
0.28.2; no dependency files were changed in this commit.

The forest manifest supplies pre-phase registration; `core/forest-main.js`
calls `pinpinElderPieces()` behind a definition guard and applies each
descriptor's build, transforms and color.
Names are prefixed `elder-sanctuary/`. Rotations are XYZ radians and scales XYZ.
A disabled plugin has no definition: callers must respect its enabled state,
for example with a `typeof` guard. See the repository README for integrated runtime checks.

An offline CPU Blender render of the actual Mesh output was visually inspected
at `/tmp/elder-sanctuary-preview.png`, using temporary studio lights and camera.
That is geometry evidence, **not** browser/WebGPU integration. No push or deploy
was performed. The canon checkout was never edited.

## Content notices

Character/world-specific configuration and procedural artwork are creative
content; they are not automatically MIT because they are JavaScript. Preserved
canon scope, content, third-party and MIT notices are under `notices/`. No book
images, outside assets, fonts, or upstream GPU code were copied. No new blanket
license, third-party clearance, or approved-canon status is claimed.
