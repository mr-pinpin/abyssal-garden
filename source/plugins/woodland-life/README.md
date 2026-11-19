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
