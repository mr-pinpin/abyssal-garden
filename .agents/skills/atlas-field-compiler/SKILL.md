---
name: atlas-field-compiler
description: Compile artist-estimated height and segmentation guides into deterministic image-coordinate terrain studies with canon protection and placement diagnostics. Use for atlas studies, not registering or modifying game-world terrain.
---

Keep inputs and authority distinct. An oblique illustration is visual reference, not a height source. Accept only an explicitly labeled grayscale estimated-height guide; never convert photograph luminance into metric elevation. Record source image hashes, dimensions, segmentation palette, units and coordinate origin.

A registered canon region mask takes precedence over generated masks. Conservatively exclude cottage, Elder, bridge/picnic footprints even where a generated image omits white holes. Flatten water using semantic water labels, not image brightness. Reject foliage candidates on water, paths, occupied/unknown pixels and their margins; account for thin features using conservative cell aggregation rather than sparse point sampling.

Use deterministic candidate sampling and explicit grid resolution/seed/margin. Test flat water despite varying grayscale input, canon override against generated green, candidate exclusion margins, determinism and malformed-image errors. Required-input integration tests must fail when declared inputs are missing; never silently return a passing result. Bundle the required rasters, canon guard, provenance and applicable creative notices, and use relative paths so the documented CLI reproduces the result off the author’s host. Test the bundled inputs rather than relying on a private absolute canon path. Support only the PNG formats the decoder actually validates; fail clearly on unsupported inputs.

Publish a small diagnostic using the actual generated rasters, grid protections and candidate overlay. Label heights artist-estimated, coordinates image-normalized, and outputs unreviewed studies rather than deployed game geometry. A connected blue region is only a stream-continuity candidate; it proves neither surveyed hydrology nor a route. Normalized image-bound transfer does not establish world registration or correct generated feature positions.

Record own observed start/finish and input/output hashes. Preserve source images and provenance; keep renderer/manifest integration outside this role unless explicitly assigned. Evolve the procedure from observed failures, especially registration drift and generated-mask omissions.
