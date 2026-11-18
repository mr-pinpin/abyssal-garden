# Forest recovery handoff

The local `main` now contains both worker changes, preserving authors:

- `e990a75`: home/forest and Elder sanctuary, from worker commit `b21d941`.
- `19a949c`: five recovered GLBs/previews and character fallbacks, from `f20b130`.

The integration commit recorded in the required receipt adds the default forest
renderer, scene registration and toggles, material-color loading, generated
`index.html`, tests, and this evidence. No push, deployment, driver, supervisor,
canon edit, or edit of the source asset repository was performed.

**Verified locally:** actual file/create/delete and Git-ref access in this worker;
exact source-commit GLB/PNG identity and notices; 21 plugin tests; seven combined
execution cases including the actual minified production JavaScript; projected
camera target and keyboard travel; runtime layers reduce actual mock draw calls;
individual/all plugin omission; missing-asset procedural fallback; five distinct
material palettes retained with backward-compatible default parser output. Real
build logs show every scene plugin rebuilt alone while all other units remained
cached, manifest disable omission, a zero-compile warm run, and successful tier 1.

The final scene has 164,396 vertices / 78,518 triangles, grouped into four draws
per frame (landscape and the three scene groups). Camera exploration is bounded,
not collision physics. The generated entry is about 46 kB plus the five external
GLBs. Asset sizes and checksums are in `assets/recovered/recovery.json`;
page checksums are in `evidence/artifacts.json`.

**Not verified:** actual GPU/shader execution, visual browser quality, a real
browser screenshot, public deployment, and pinned esbuild 0.28.2. The sandbox
rejected loopback socket creation and Chrome's setsockopt, and preview service
was unavailable. Builds used the already installed esbuild 0.28.1 without a
lockfile change. `evidence/browser-blocker.json` records the commands, errors and
classification. These are environment limitations, not evidence that a mocked
WebGL success proves a working browser page.

The publisher must run the README's server/Chrome commands and
`python3 tools/browser-check.py` in a browser-capable environment; inspect the
four generated screenshots; resolve any browser/visual issue; rerun builds with
the pinned compiler; then publish the verified commit and report its public URL.
No new GitHub credentials should be sent through chat. There is no need for
Miguel to perform code work if another existing worker has the required browser
capability. The receipt is `needs-hands` because the assigned screenshot
criterion remains unmet, rather than reporting this attempt as unknown or done.

Rollback the forest entry with a normal revert of the integration commit from
the receipt (both asset/scene worker commits remain available). For a complete
return to the prior garden, select the preserved base
`d892ebba3d1ac5fe4aa2ec920001c9c505734c6f` on a separate checkout; do not rewrite
worker branches or delete recovered asset history.
