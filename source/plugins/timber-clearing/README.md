# Timber and teamwork — unreviewed showcase study

`pinpinClearingPieces()` stages all five supplied Blender models via the existing
`setPiece` GLB loader, with authored scale/orientation, a stream, grass banks and
path. Asset keys match `source/manifest.json`; all files live in `assets/pinpin/`.

Canon: read-only `/home/cloudroom-agent/showcase/canon/docs/storyboard/stories/timber-tractor.json`.
Scenes 03–04 establish the chestnut beaver in a blue vest, stationary red tractor
and empty trailer, windfallen tree beside a stream; 05–08 establish yellow crane
and dark grapple; 12–14 establish the repaired wooden footbridge and final plank
for small paws. The young hedgehog follows
`docs/storyboard/models/pinpin-v1/reference.md`: cream muzzle, brown spines and
eyes, rounded ears, four short separated paws. The models are static studies,
not animated actors or approved replacement book illustrations. No person/animal
is placed in a moving tractor. Relative scene geography, scales and vegetation
are authored interpretation. Core renderer owns actual lighting and ambience.

A failed or disabled loader uses a simple visible procedural proxy and records
`source.loaded:false`; the interface reports the missing study rather than
claiming that all five Blender models loaded. Creative content notices in
`assets/pinpin/notices/` apply; JavaScript geometry is not blanket MIT content.
