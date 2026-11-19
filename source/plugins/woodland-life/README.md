# Woodland life

Six small butterflies hover over a warm wildflower patch beside the clearing.
Authored geometry, no external assets or dependencies; no claims of book canon.

`pinpinLifePieces()` returns cached standard scene descriptors. Three static
batched flower meshes and eighteen dynamic butterfly parts. Call
`pinpinUpdateLife(seconds)` before drawing, then update dynamic model matrices
**in place**, preserving references held by draw records. The plugin owns no
scheduler. Animate only in visible WebGPU mode, at most 30fps; honour reduced
motion. Software/reduced-motion uses the deterministic initial pose. Hidden
tabs schedule no animation. Disabling the manifest entry removes the habitat.

## Atlas-led understory increment (19 November 2026)

Three extra static color batches add arching grass blades and folded fern leaves,
with irregular seeded colonies and explicit stream/bridge exclusion. Total plugin
budget is 34,000 triangles (measured 31,746), 24 descriptors, still only 18 dynamic
butterfly parts. This replaces the first increment's 2,000-triangle budget because
leaf silhouette detail is now an explicit target. These are batched actual meshes,
not GPU instancing, alpha-cutout textures or photoreal materials. No new runtime
textures, downloads, per-blade draws or animation scheduler.

The atlas-inspired image study and provenance are under `references/`. They are
visual references only. The current scene placement is authored world-space data;
a later density-map consumer must use its owner's explicit coordinate contract.

## Registered texture consumer

Call `pinpinLifePieces({vegetationField})` on first construction. The field is
`{width,height,density,excluded,worldFromUV,seed,limit,marginCells}`: row-major
linear density values in [0,1], equally sized boolean exclusions, normalized
image u-right/v-down, and an explicit `worldFromUV(u,v) => [x,y,z]` registered
projection including terrain height. The plugin does not guess that projection.
Cells are sampled deterministically and ranked without top-left truncation bias.
A valid empty mask produces no vegetation; invalid/unregistered input is rejected.
Up to 260 points control all this plugin's grass, flower and fern placement;
legacy ellipses are used only when no field is supplied. Sampling is cached at
scene initialization; a new world requires reconstruction, not in-place reuse.

The producer must choose `marginCells` to cover actual plant extents in world
units, mark water/roads/prop footprints excluded, and supply ground height from
the registered terrain. This is decoded texture-driven placement, not a claim
that the current unregistered atlas fields have been activated. Trees, rocks and
other plugins require their own species fields and migration hooks.
