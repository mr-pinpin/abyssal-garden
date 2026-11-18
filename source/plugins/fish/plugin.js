// ============================================================================
// plugin: fish - fish mesh (mesh id 13), schooling instances
// ============================================================================
// a small fish: five rings and a forked tail
function meshFish() {
  const m = new Mesh();
  const X = [0.5, 0.3, 0.05, -0.22, -0.34], H = [0.01, 0.13, 0.17, 0.09, 0.035], Wd = [0.01, 0.05, 0.065, 0.03, 0.012], rings = [];
  for (let i = 0; i < 5; i++) { const r = []; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; r.push(m.v(X[i], sin(a) * H[i], cos(a) * Wd[i])); } rings.push(r); }
  for (let i = 0; i < 4; i++) for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6; m.quad(rings[i][k], rings[i + 1][k], rings[i + 1][k2], rings[i][k2]); }
  const a = m.v(-0.33, 0, 0), b = m.v(-0.56, 0.2, 0), c = m.v(-0.47, 0, 0), d = m.v(-0.56, -0.2, 0);
  m.tri(a, b, c); m.tri(a, c, d);
  return m;
}
