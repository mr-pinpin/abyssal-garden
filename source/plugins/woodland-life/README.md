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
