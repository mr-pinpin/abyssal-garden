# Abyssal Garden: Mr PinPin edition

**Live: <https://mr-pinpin.github.io/abyssal-garden/>** (developer build with fly-through and benchmark keys:
[`dev.html`](https://mr-pinpin.github.io/abyssal-garden/dev.html); deployed commit:
[`version.json`](https://mr-pinpin.github.io/abyssal-garden/version.json))

This is the Mr PinPin fork of [Noniv/abyssal-garden](https://github.com/Noniv/abyssal-garden) by Maksymilian Dendura
(MIT). The original is a whole underwater world drawn with raw WebGPU from one HTML file. Here it becomes the base
for bringing Mr PinPin's world to life: the engine is split into a **core plus plugins**, set pieces can be replaced
by **Blender models** (glTF `.glb` in [`assets/`](assets)), and the build is **tiered** so that changing one plugin
rebuilds one plugin.

## Layout

```
source/
  manifest.json          load order: core units, plugins (phase pre / post, dev-only), and the asset table
  core/                  the engine: quality.js, math.js, shaders.js, world.js, main.js, template.html
  plugins/<name>/plugin.js   one folder per scene element or feature
    gltf-loader/         loads Blender .glb set pieces listed in manifest.json "assets", procedural fallback
    fluke/ ship/ manta/ fish/   the set pieces (whale fluke, sunken ship, manta ray, fish)
    audio/               the procedural soundscape
    dev-tools/           fly-through (F) and benchmark (B), only in dev.html
  build.mjs              the tiered build
  prove-tier0.mjs        proof that a plugin change rebuilds only that plugin
  glb-check.mjs          checks a Blender export with the loader's own parser
assets/                  Blender exports (.glb); assets/examples/cube.glb is a parser test
.github/workflows/pages.yml   tier 2: deploy on push to main
```

All units share one scope (they are concatenated into one async function, as in the original), so a plugin can
define meshes and hooks the core calls. `phase: "pre"` plugins come before `core/main.js`, `"post"` after it.

## Build tiers

| Tier | Command (in `source/`) | What it does | Time |
|---|---|---|---|
| **0** | `npm run t0` (or `node build.mjs t0 <plugin>`), `npm run watch` | Hashes every unit, recompiles **only units whose source changed** into `source/.cache/`, assembles `dev.html` from the cache | ~0.2 to 0.35 s for one plugin |
| **1** | `npm run build` (`t1`) | Every unit through the same cache, then one minify of the whole into the single self-contained `index.html` (plus `dev.html`) | ~0.8 s cold, ~0.2 s warm (mostly the minify) |
| **2** | `git push` to `main` | `.github/workflows/pages.yml`: tier 1 + the tier 0 proof in CI, then deploys `index.html`, `dev.html`, `assets/`, `manifest.json`, `version.json` to GitHub Pages | a minute or two |

Compiling a unit means checking its syntax on its own (an error names the plugin file and line) and shrinking the
WGSL inside its `/*wgsl*/` literals. The cache key is the hash of the unit's source.

**Proof that a plugin change rebuilds only that plugin** (`npm run prove`, also run in CI on every deploy): it
appends a line to `plugins/ship/plugin.js`, runs tier 0, checks the compiled set, and restores the file. A real run:

```
$ edit plugins/ship/plugin.js; build t0
  cached   core:quality             1.4 ms
  cached   core:math                0.3 ms
  cached   core:shaders             0.7 ms
  cached   core:world               0.6 ms
  cached   gen:assets               0.1 ms
  cached   plugin:gltf-loader       0.2 ms
  cached   plugin:fluke             0.1 ms
  COMPILED plugin:ship            214.3 ms
  cached   plugin:manta             0.4 ms
  cached   plugin:fish              0.1 ms
  cached   core:main                7.1 ms
  cached   plugin:audio             0.2 ms
  cached   plugin:dev-tools         0.3 ms
  -> dev.html 164.3 kB (54.1 kB gz), assembled in 96.8 ms
tier 0: 1/13 units compiled (plugin:ship), total 334 ms

OK: only plugin:ship was rebuilt
```

(The first compile in a process pays ~200 ms to start esbuild; `npm run watch` keeps it warm.)

## Blender models

1. In Blender: *File > Export > glTF 2.0*, format **glTF Binary (.glb)**, **+Y Up**, *Apply Modifiers*.
   Metres; triangles are merged across meshes, node transforms are baked in.
2. Put the file in `assets/`, e.g. `assets/ship.glb`, and check it: `node source/glb-check.mjs assets/ship.glb`.
3. List it in `source/manifest.json`:
   ```json
   "assets": { "ship": { "url": "assets/ship.glb", "scale": 1, "offset": [0, 0, 0] } }
   ```
   Set pieces that can be replaced: `fluke`, `ship`, `manta`, `fish` (manta and fish keep their swimming
   animation; their models are in body units, half span 1 for the manta).
4. Push. If a listed model fails to load, the procedural original is used and the console says why.

With the asset table empty (as now), the site renders the original garden.

---

*The original README follows.*

## Abyssal Garden

**A dreamy underwater world you can swim through, right in your browser.**

Towering kelp forests, sunbeams pouring through a rippling surface, a sunken ship, manta rays gliding overhead.
And all of it is made by code: no images, no 3D models, no sound files. The whole world fits in **one 96 KB HTML file**.

![Kelp forest with a stone whale tail and a manta ray](.github/screenshots/whale-fluke.jpg)

## Try it

1. Download [`index.html`](index.html).
2. Open it in **Chrome** or **Edge** on a desktop computer.
3. Wait a few seconds while the world is built, then press **Dive in** and start swimming.

Nothing to install, and it works offline. It needs a browser with **WebGPU**. If you see *"This scene needs WebGPU"*, update your browser or switch to Chrome / Edge.

## What's down there

- **Kelp forests** that sway in the current and sparkle with tiny gold and green specks
- **Light rays** streaming down from a wavy surface, with shimmering caustics on the sea floor
- **A sunken wooden ship**, a **giant stone whale tail**, rock arches, canyons and floating boulders
- **Manta rays**, schools of fish, rising bubbles and drifting particles
- **A purple grotto** with glowing magenta ground cover, coral and barrel sponges
- **A soundscape** made up as you listen: a deep rumble, distant whale calls, soft chimes and bubbles

| | |
|---|---|
| ![Shipwreck](.github/screenshots/shipwreck.jpg) | ![Looking up through the kelp](.github/screenshots/kelp-forest.jpg) |
| ![Barrel sponges](.github/screenshots/sponge-garden.jpg) | ![Light rays over the kelp basin](.github/screenshots/light-rays.jpg) |

![The purple grotto](.github/screenshots/purple-grotto.jpg)

## Controls

| | Keyboard & mouse |
|---|---|
| Look around | Move the mouse |
| Swim | `W` `A` `S` `D` |
| Up / down | `E` / `Q` |
| Swim faster | Hold `Shift` |
| Jump to a viewpoint | `1` to `6` (the spots in the screenshots) |
| Menu | `Esc` releases the mouse and opens the menu with the list of controls; **Resume** takes you back |
| Sound on / off | `M` (sound starts when you dive in) |
| Performance stats | `H` |
| Detail level | **Low**, **Medium** or **High** in the menu (reloads the page) |

The seabed, cliffs and arches are solid: you glide along the rock instead of swimming into it, and you still fit through every tunnel and arch. Kelp, plants, corals, sponges, loose rocks, the floating boulders, the ship and the whale tail you can swim through.

**On a touchscreen:** hold one finger down to swim forward and slide it to steer. Put a second finger down to go faster. The `≡` button in the corner opens the menu. Phones always show the scene in landscape and start on Low or Medium detail. (Touch support is experimental.)

## Detail levels

The **Low**, **Medium** and **High** buttons in the menu pick the detail level; the current one is lit. Each level is the same world, built with less in it:

| Level | What it is | Picked on a first visit for |
|---|---|---|
| **High** | The full scene | Computers |
| **Medium** | Half of the leaves, sparkles and pebbles; small rocks, sponges and corals cast no shadows | Phones with 8 GB of memory |
| **Low** | A quarter of the leaves, no anti-aliasing, coarser rocks and corals, simpler lighting, 480p to start with | Other phones, and computers with 4 GB of memory or less |

If loading crashes the tab, or the graphics driver gives up, the page starts again one level lower. Your browser remembers the level, and the resolution and draw distance the scene settled on, for the next visit.

## How it works

- The seabed is sculpted on your graphics card every time the page opens, then decorated with about two million kelp leaves and plants, tens of thousands of rocks, and thousands of sponges, corals and fish.
- Everything is drawn with **WebGPU** directly. No game engine or 3D library is used.
- The ship, whale tail, mantas, fish and corals are built from simple mathematical shapes (in this fork, the ship, whale tail, mantas and fish live in `source/plugins/` and can be swapped for Blender models).
- The sound is synthesized live with the Web Audio API.
- It's built to run smoothly: about 180 fps at 2560×1440 on an RTX 5070 Ti. On slower hardware it aims for 60 fps by lowering first the resolution and then how far away plants and rocks are drawn, in small steps. The scene is already running, blurred, behind the start menu, so most of that tuning is done before you dive in. A low-end phone (Samsung Galaxy A16) reaches about 20 fps at 670×372 on Low.

## Make it your own

The readable source code is in the [`source`](source) folder. To change something and rebuild `index.html` you need [Node.js](https://nodejs.org) 18 or newer:

```bash
cd source
npm install
npm run build
```

This writes a new `index.html` next to this README. `npm run t0` (or `npm run watch`) writes the unminified `dev.html`, which is easier to debug in the browser's developer tools.

`dev.html` also has two extra tools that are not part of `index.html`: `F` flies the camera along a one-minute path through the whole world, and `B` runs that flight as a benchmark and reports frame and GPU times.

| File | What's inside |
|---|---|
| [`source/core/world.js`](source/core/world.js) | The world layout: rock walls, arches, tunnels, kelp forests, sponge gardens, fish schools, mantas, the ship and the whale tail. **A good place to start.** |
| [`source/core/shaders.js`](source/core/shaders.js) | The look: water and fog colors, lighting, kelp, rocks, the water surface and light rays (WGSL shader code) |
| [`source/core/main.js`](source/core/main.js) | The renderer, the camera, the controls, the six viewpoints and the camera path the world is laid out around |
| [`source/plugins/audio/plugin.js`](source/plugins/audio/plugin.js) | The soundscape |
| [`source/core/quality.js`](source/core/quality.js) | The detail levels: which one a device starts on, and what is remembered between visits |
| [`source/core/math.js`](source/core/math.js) | Noise, random numbers and mesh-building helpers |
| [`source/plugins/dev-tools/plugin.js`](source/plugins/dev-tools/plugin.js) | Development tools (fly-through and benchmark), only in `dev.html` |
| [`source/core/template.html`](source/core/template.html) | The page around the scene: loading bar, start menu, links and their styles |

Some easy first tweaks:

- **Water color:** `WCOL` (blue-green water) and `PCOL` (purple grotto) near the top of the shared scene code in `shaders.js`
- **Sunlight color:** `SUNC` right next to them
- **Brightness and light rays:** `EXPO` and `RAYS` in `main.js`
- **Swimming speed:** search for `26 : 7` in `main.js` (fast speed : normal speed)

## License

[MIT](LICENSE): free to use, change and share, including in your own projects.
