# Recovered Blender showcase studies

These are byte-for-byte recoveries from the local asset repository
`/code/v2-first/pinpin-garden-assets`, commit
`8978b223db3b5bd1ae07c0fd16aec54b14056cb8`. That repository was read, never edited.
There are five GLBs and five 640 × 640 four-angle preview PNGs. These are
**unreviewed procedural showcase studies**, not approved book art.

`assets.json` is the exact original manifest. Its `out/` paths refer to the
original repository; here each `out/<id>.glb` is `<id>.glb` and each
`out/<id>-turntable.png` is `<id>-turntable.png`. `recovery.json` records the
explicit path mapping, source commit, byte sizes and SHA-256 values. Do not edit
the original manifest to disguise the recovery or assign new approval status.

The preserved `notices/` files are exact committed copies from the asset
repository. Creative content is excluded from the source software MIT grant.
The explicit showcase task authorizes this integration; these records do not
relicense the content or claim rights in unprotectable AI output.

From the garden root, revalidate without writing assets:

```sh
python3 source/plugins/pinpin-character/recover.py
node source/glb-check.mjs assets/recovered/pinpin.glb
```

To reproduce the import from the pinned local Git objects, use the same command
with `--import`. It writes only this recovery directory; it does not regenerate,
modify, or depend on the source asset repository's current checkout files.
Checks cover exact blob identity, GLB headers and chunk bounds, PNG signatures,
chunk CRCs, nonblank decompressed PNG data, dimensions and SHA-256s, preserved
notices and manifest, plus parsing through the garden's actual GLB loader.
The geometry tests also check every imported mesh's indices and finite bounds.

`source/plugins/pinpin-character/README.md` describes the five piece descriptors,
procedural fallbacks, build proof, canon references and renderer limitations.
