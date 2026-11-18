// ============================================================================
// plugin: ship - sunken ship set piece (mesh id 11)
// ============================================================================
// sunken ship (bow at +x): keel with stem and stern posts, curved ribs, hull planking with a breach,
// raised stern castle with transom, deck remnants, two masts with yards, bowsprit
function meshShip() {
  rseed(220);
  const m = new Mesh(), Lh = 17, B = 5.6, Dp = 7.6;
  const hb = (x) => B * pow(max(1 - pow(abs(x / Lh), x < 0 ? 3.6 : 2.6), 0), 0.5);
  const dp = (x) => Dp * (1 - 0.36 * pow(abs(x / Lh), 2.5));
  const sheer = (x) => 0.5 + (x > 0 ? 3.0 : 3.8) * pow(abs(x / Lh), 2.2);
  const pt = (x, ph, off = 0) => { const b = hb(x) + off, d = dp(x) + off, s = sheer(x); return [x, s - (d + s) * pow(max(cos(ph), 0), 0.66), b * Math.sign(ph) * pow(abs(sin(ph)), 0.8)]; };
  const out = (p) => { const l = hypot(p[1] + 0.5, p[2] * 1.3) || 1; return [0, (p[1] + 0.5) / l, p[2] * 1.3 / l]; };
  const up = () => [0, 1, 0];
  const keel = [];
  for (let i = 0; i <= 44; i++) { const x = mix(-Lh - 1.0, Lh + 2.4, i / 44), e = max(abs(x) / Lh - 0.78, 0) * 4.2; keel.push([x, -dp(clamp(x, -Lh, Lh)) - 0.3 + e * e * e * 4.2, 0]); }
  m.sweep(keel, 0.55, 0.95, up);
  for (let x = -Lh + 0.7; x < Lh - 0.3; x += 0.8) {
    const a0 = rnd() < 0.1 ? rr(-0.9, -0.2) : -PI / 2, a1 = rnd() < 0.1 ? rr(0.2, 0.9) : PI / 2, pts = [];
    for (let i = 0; i <= 16; i++) pts.push(pt(x, mix(a0, a1, i / 16)));
    m.sweep(pts, 0.24, 0.3, out);
  }
  const holeX = rr(-6, 2), holeS = rnd() < 0.5 ? 1 : -1;
  const BR = [[holeX, holeS * 0.8, 3.2, 0.42], [7, -holeS * 0.95, 2.4, 0.34], [12, holeS * 0.5, 1.7, 0.28], [-11, -holeS * 0.55, 2.1, 0.3]];
  const holed = (x, ph) => { for (const h of BR) { const a = (x - h[0]) / h[2], b = (ph - h[1]) / h[3]; if (a * a + b * b < 1 + 0.45 * sin(x * 3.1 + ph * 9)) return true; } return false; };
  const NS = 14, xs = []; for (let x = -Lh + 0.35; x <= Lh - 0.3; x += 0.85) xs.push(x);
  for (let j = 0; j < NS; j++) {
    const p0 = mix(-1.5, 1.5, j / NS), p1 = mix(-1.5, 1.5, (j + 1) / NS), sg = p0 + p1 < 0 ? -1 : 1, lo = sg < 0 ? p1 : p0, hi = sg < 0 ? p0 : p1;
    let pv = null;
    for (const x of xs) {
      const cu = [m.v(...pt(x, lo, 0.27)), m.v(...pt(x, hi, 0.14)), m.v(...pt(x, lo, 0.1)), m.v(...pt(x, hi, 0.1))];
      if (pv && !holed(x - 0.42, (p0 + p1) / 2)) {
        if (sg > 0) { m.quad(pv[0], pv[1], cu[1], cu[0]); m.quad(pv[2], cu[2], cu[3], pv[3]); }
        else { m.quad(pv[0], cu[0], cu[1], pv[1]); m.quad(pv[2], pv[3], cu[3], cu[2]); }
      }
      pv = cu;
    }
  }
  for (const sgn of [-1, 1]) {
    let pts = []; for (let x = -Lh + 0.6; x <= Lh - 0.6; x += 1) pts.push(pt(x, sgn * PI / 2, 0.2)); m.sweep(pts, 0.3, 0.28, up);
    // stern castle bulwarks
    for (let j = 0; j < 3; j++) { pts = []; for (let x = -Lh + 0.4; x <= -Lh + 8.5 - j; x += 0.9) pts.push([x, sheer(x) + 0.55 + j * 0.86, sgn * (max(hb(x), 2.6) + 0.15)]); m.sweep(pts, 0.82, 0.09, () => [0, 0, sgn]); }
  }
  // transom
  for (let y = -3; y < sheer(-Lh) + 3; y += 0.86) { const w = max(1.2, 2.9 * sstep(-4.5, 1.5, y)); if (rnd() < 0.9) m.sweep([[-Lh + 0.35, y, -w], [-Lh + 0.35, y, w]], 0.82, 0.1, () => [1, 0, 0]); }
  for (let x = -Lh + 2; x < Lh - 2; x += rr(1.8, 3.2)) m.sweep([[x, sheer(x) - 0.25, -hb(x)], [x, sheer(x) - 0.2, 0], [x, sheer(x) - 0.25, hb(x)]], 0.26, 0.26, up);
  for (let z = -3.9; z <= 3.9; z += 0.62) { let x = -Lh + rr(1, 5); while (x < Lh - 4) { const x1 = min(x + rr(3, 9), Lh - 3.5); if (rnd() < 0.6) { const pts = []; for (let xx = x; xx <= x1; xx += 1) if (hb(xx) > abs(z) + 0.3) pts.push([xx, sheer(xx) - 0.05, z]); if (pts.length > 1) m.sweep(pts, 0.56, 0.07, up); } x = x1 + rr(0.5, 3); } }
  // foremast with yard, broken main mast, bowsprit
  m.sweep([[7, -Dp + 0.6, 0], [7.1, 1, 0], [7.4, 8, 0.3], [7.8, 15, 0.8]], (k) => 0.62 - k * 0.1, (k) => 0.62 - k * 0.1, () => [1, 0, 0]);
  m.sweep([[7.5, 9.5, -5.2], [7.5, 9.6, 0.3], [7.5, 9.2, 5.6]], 0.26, 0.26, up);
  m.sweep([[7.7, 13.2, -3.2], [7.7, 13.3, 3.6]], 0.2, 0.2, up);
  m.sweep([[-3, -Dp + 0.6, 0], [-3.2, 1, 0.2], [-3.9, 6, 1.0], [-5.2, 9.5, 2.6]], (k) => 0.74 - k * 0.1, (k) => 0.74 - k * 0.1, () => [1, 0, 0]);
  m.sweep([[Lh + 1.4, 2.6, 0], [Lh + 8, 5.2, 0.2]], 0.34, 0.34, up);
  return m;
}
