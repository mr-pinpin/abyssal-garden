# PinPin home and connecting forest — unreviewed showcase study

`pinpinHomePieces()` defines a standalone pre-phase scene plugin in the existing
Mesh/math scope. Calling it returns 99 piece descriptors: a three-room home,
plan-based furniture, green open entry, round window frames, partial moss roof,
13 woodland trees, ferns, amber markers, and a joined path toward the sanctuary.
No DOM, GPU, fetch, random-stream mutation, or registration occurs at definition
time. Every piece has a private zero-argument `build()` returning the shared
packed `{vb, ib, nv}` format. All assets are `null`: this is procedural geometry
and does not require or change a binary asset.

## Canon evidence and interpretation

Reference paths are relative to the read-only canon checkout
`/home/cloudroom-agent/showcase/canon`. Source hashes are in `provenance.json`.

| Reference | Fact followed |
| --- | --- |
| `docs/storyboard/locations/pinpin-house/README.md` | Three rooms: common kitchen/living room in the south, bathroom northwest, bedroom northeast; the recess between private rooms stays outdoors. |
| `docs/storyboard/locations/pinpin-house/scene/house-plan.json` | Exact selected room polygons, wall centerlines/thicknesses/heights, opening stations and sizes, furniture positions/footprints. Plan SHA-256: `cab510b31c13e85beaa689edb54005223412a988f640724e56b9d95dba20c28c`. |
| `docs/storyboard/locations/pinpin-house/references.json`, `exterior-book` | Low mossy roof, round windows and green arched entry are woodland house motifs. Their exact exterior placement is not a recovered survey. |
| Same file, `common-book` | Green arched entry, round radial windows and amber light; furnishing arrangement remains governed by the plan. |
| `docs/storyboard/locations/AGENTS.md` | Current geometry takes precedence over legacy cubemap staging; internal door widths do not establish adult walking clearance. |

The plan's `(X,Y,Z)` becomes runtime `(X,Z,-Y)`, translated by `[-12,0,0]`.
Room contours are ear-clipped, preserving concavities and the exterior recess.
Walls retain the plan's station-based apertures, with 16-segment faceted round
windows/arched doorway. The front leaf is open outward by 75°; internal leaves
are omitted for this cutaway. This is a documented display state, not a claim
that the canonical location defaults changed. Simplified furniture preserves
selected footprint records; individual prop surfaces are authored proxies.

The common-room roof is omitted to show the layout; moss caps over the two rear
rooms are new showcase geometry. Roof form, tree positions, ferns, color palette,
lantern/marker placement, and the entire forest route are authored interpretation.
The home and sanctuary's relative world coordinates are staging, not book
geography. This plugin is not a replacement for the location pack's measured
Blender builder, a new approved location version, or a panorama.

The path joins `[-12.4,3]` through `[-12.4,6]`, `[-8,8.8]`,
`[3.8,8.8]`, `[7,8.8]`, `[7,2.5]`, `[9,-1]`, `[11,-5]` to `[14,-7]`.
It follows the north bank before crossing the existing timber-clearing bridge
at `[7,5.6]`. No dirt strip is drawn over its open water; two earth approaches
meet the scaled GLB deck top at y=0.804. The outdoor ribbon is at least 1.8m wide,
with varied shoulders and rounded joins. The canonical 0.59952 m doorway remains a narrow pinch
point. Tests sample a 0.2 m-wide central doorway route and a wider outdoor route;
these rays do not constitute a navigation/collision engine or adult clearance
approval. Amber pieces are geometry/color cues; the rendezvous renderer owns
actual lighting, ambience and interaction.

## Checks and integration

From the repository root:

```sh
node --test source/plugins/pinpin-home/contract.test.mjs
python3 source/plugins/pinpin-home/tier0-check.py
```

The Node tests check definition-time side effects, descriptor uniqueness,
finite transforms/geometry, packed buffer shape, valid triangle indices,
nonzero triangle area, sensible world bounds, local base y=0, byte-deterministic
rebuilds, unchanged shared RNG, canonical floor areas, and real triangle/ray
clearance along the route. `floor-areas.json` is an independent area calculation
from the pinned room polygons, so tests do not require the canon checkout.

`tier0-check.py` temporarily enables only this new plugin alongside the original
plugins, runs `npm run t0 -- pinpin-home`, verifies exactly one compiled unit, verifies the next
run compiles none, verifies `enabled:false` omits its definition, and restores
`source/manifest.json` byte-for-byte in `finally`. The observed output is in
`tier0-evidence.txt`. The registry was unavailable (`EAI_AGAIN`); local checks used
preinstalled esbuild **0.28.1** via an ignored local `node_modules` symlink, rather
than the lockfile's 0.28.2. No package or lockfile changes are included.

The default forest manifest registers this pre-phase entry, and
`core/forest-main.js` calls `pinpinHomePieces()` behind a definition guard,
applying each descriptor's transforms and color. The piece
names are prefixed `pinpin-home/`; all transforms are XYZ, rotations in radians,
local mesh base is y=0, and runtime ground is y=0. The integration is documented in the repository README. Disabling this plugin safely omits its definition; callers
must follow the same enabled state (for example a `typeof` guard).

Offline CPU Blender inspection of the actual generated vertices was performed
at `/tmp/pinpin-home-preview.png`. It is geometry evidence with a temporary studio
camera/light/ground, **not** a browser/WebGPU integration test. No deployment or
push was performed.

## Content notices

Creative house configuration and procedural artwork are excluded from a blanket
software MIT grant. The read canon `LICENSE`, `CONTENT-LICENSE.md`, and
`THIRD-PARTY-NOTICES.md` are preserved under `notices/` together with LICENSE-MIT.
Their inclusion does not grant broader rights to adaptations or third-party
content. No book images, external models, textures, or upstream GPU code were
copied. This remains an unreviewed study produced for Miguel's assigned showcase.

## Woodland craft pass

The authored exterior now uses three batched leaf palettes, sparse ferns,
shoulder stones, cream/ochre flowers, mushroom clusters, directional root
fingers, and two entry herb pots. A private integer hash varies placement,
height and silhouette; shared RNG and all measured plan records stay intact.
Shoulder sites are rejected against every route segment and the stream bank,
so bends cannot plant details across an adjoining walking segment.

The complete plugin has 45,715 packed vertices and 40,023 triangles; added
detail uses 14,040 vertices across 13 material batches. Contract checks cap that
detail at 18,000 vertices and test real triangle clearance at low body heights
across a 1.1m outdoor ribbon, plus bridge approach placement. This is geometry
evidence; the browser render and integrated asset clearances require the parent
integration review. No new visual approval or deployment is claimed.

The enclosure pass adds 17 broad irregular planting islands and 18 slender
saplings with six overlapping angular crown layers each. Waist-high radiating
leaves create a separate middle layer above the colored ground footprints.
These are 10 material batches, 18,139 vertices, with a 20,000-vertex contract
limit; all ground islands together cover more than 70 square meters. Outdoor
clearance is checked against the enclosure at offsets ±0.65m and heights
0.12m, 0.5m and 1.25m. The earlier browser image `after-home.png` was inspected
and showed insufficient enclosure; the new enclosure still requires a fresh
browser visual review by the integration owner.
