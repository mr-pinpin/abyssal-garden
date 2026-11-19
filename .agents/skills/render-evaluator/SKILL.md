---
name: render-evaluator
description: Evaluate browser-rendered scene changes with matched visual evidence and bounded turnaround records. Use for visual acceptance or before/after renderer comparisons, not implementing renderer features.
---

Inspect actual pixels before judging a scene. Record exact source commit, built artifact identity, camera position/look/FOV or a verified unchanged preset, viewport, DPR, backend, GPU/driver, browser version, quality settings, animation time and reduced-motion preference. Compare the same scene and camera on the same hardware/settings. If any dimension differs or is unknown, label the comparison unmatched and limit the conclusion accordingly.

Before capture, wait for an observed new frame and explicit transition/fade completion when the app exposes telemetry. A fixed sleep can capture an intermediate silhouette and invalidate an otherwise matched comparison. Record intentional geometry/detail-level changes separately; same-camera/hardware evidence with different detail policy supports visual acceptance of the combined change, not a quality-normalized performance comparison.

A successful renderer status or screenshot command does not prove scene pixels reached the compositor. When screenshots are blank, distinguish device/shader failures, GPU texture pixels and browser compositing. Prefer the app's bounded opt-in pixel readback when available; retain a separate browser screenshot for CSS/control layout. A software-renderer image supports software appearance only. Do not infer GPU artistic quality from it.

State artistic observations separately from performance and functionality. Judge composition, spatial depth, lighting/material coherence, environmental detail, motion and navigation using visible evidence. Identify a specific weakness and a finite acceptance view/action. Color diversity verifies nonblank pixels, not photorealism; test counts, feature lists, mesh counts and FPS do not establish artistic equivalence. Treat the upstream project's performance statements as its authors' measurements, not results reproduced on this hardware.

For turnaround, preserve task received/queued, first observed execution, commit, workflow start/deploy completion and verified-public timestamps with their source. Use null for unobserved boundaries. Git commit time is not task start; workflow creation is not agent queue time; deployment success is not public interaction verification. Label elapsed intervals by their real endpoints. Do not infer team idleness from objective age or a speedup from different tasks. To evaluate reuse, collect repeated matched assignments before estimating any speedup.

Deliver a short verdict, referenced images/structured evidence, uncertainties and the next concrete check. Keep raw provider conversations out of evidence. Update this skill only from demonstrated review failures or useful repeated practice, preserving scope and source provenance.
