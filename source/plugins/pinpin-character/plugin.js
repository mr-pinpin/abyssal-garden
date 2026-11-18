// Unreviewed Mr PinPin showcase interpretations; see README.md and recovered notices.
// Pure pre-phase plugin: definitions only, no DOM/GPU/fetch/registration side effects.
function pinpinCharacterPieces() {
  // Every builder owns its Mesh. No shared random state, so load order cannot change geometry.
  function ellipsoid(m, center, radius, aux = 1, segments = 16, rings = 10) {
    const point = (x, y, z) => m.v(center[0] + x * radius[0], center[1] + y * radius[1], center[2] + z * radius[2], aux);
    const top = point(0, 1, 0), rows = [];
    for (let row = 1; row < rings; row++) {
      const theta = row * Math.PI / rings, ids = [];
      for (let j = 0; j < segments; j++) {
        const phi = j * Math.PI * 2 / segments;
        ids.push(point(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)));
      }
      rows.push(ids);
    }
    const bottom = point(0, -1, 0);
    for (let j = 0; j < segments; j++) {
      const next = (j + 1) % segments;
      m.tri(top, rows[0][next], rows[0][j]);
      for (let r = 0; r < rows.length - 1; r++) m.quad(rows[r][j], rows[r][next], rows[r + 1][next], rows[r + 1][j]);
      m.tri(rows.at(-1)[j], rows.at(-1)[next], bottom);
    }
  }
  function box(m, c, s, aux = 1) {
    for (const [axis, sign] of [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]]) {
      const u = (axis + 1) % 3, v = (axis + 2) % 3;
      const ids = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
        const p = [...c]; p[axis] += sign * s[axis] / 2;
        p[u] += a * s[u] / 2; p[v] += b * sign * s[v] / 2;
        return m.v(...p, aux);
      });
      m.quad(...ids);
    }
  }
  function cone(m, base, tip, radius, aux = 0.5, sides = 6) {
    const axis = tip.map((x, i) => x - base[i]), length = Math.hypot(...axis);
    const n = axis.map(x => x / length), reference = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    let u = cross(reference, n); const ul = Math.hypot(...u); u = u.map(x => x / ul);
    const v = cross(n, u), ring = [];
    for (let j = 0; j < sides; j++) {
      const phi = j * Math.PI * 2 / sides;
      ring.push(m.v(...base.map((x, i) => x + radius * (Math.cos(phi) * u[i] + Math.sin(phi) * v[i])), aux));
    }
    const end = m.v(...tip, aux), cap = m.v(...base, aux);
    for (let j = 0; j < sides; j++) { const k = (j + 1) % sides; m.tri(ring[j], ring[k], end); m.tri(cap, ring[k], ring[j]); }
  }
  function pinpin() {
    const m = new Mesh();
    ellipsoid(m, [-0.16, 0.74, 0], [0.76, 0.56, 0.53], 0.68);
    // Four distinct short legs and paws; natural quadruped, no clothing or pedestal.
    for (const x of [-0.57, 0.42]) for (const z of [-0.35, 0.35]) {
      ellipsoid(m, [x, 0.23, z], [0.15, 0.23, 0.14], 0.9, 10, 6);
      ellipsoid(m, [x + 0.045, 0.09, z], [0.19, 0.09, 0.15], 0.6, 10, 6);
    }
    ellipsoid(m, [0.54, 0.72, 0], [0.46, 0.39, 0.40], 1);
    ellipsoid(m, [0.88, 0.61, 0], [0.31, 0.21, 0.25], 1);
    ellipsoid(m, [1.135, 0.65, 0], [0.11, 0.085, 0.12], 0.12, 12, 8);
    for (const z of [-0.30, 0.30]) {
      ellipsoid(m, [0.36, 1.015, z], [0.16, 0.18, 0.10], 0.72, 12, 8);
      // Eyes look toward +X with separated sclera, iris and pupil surfaces.
      ellipsoid(m, [0.79, 0.84, z], [0.13, 0.14, 0.12], 1, 12, 8);
      ellipsoid(m, [0.885, 0.85, z + Math.sign(z) * 0.025], [0.06, 0.085, 0.082], 0.35, 12, 8);
      ellipsoid(m, [0.93, 0.855, z + Math.sign(z) * 0.025], [0.025, 0.052, 0.05], 0.06, 10, 6);
    }
    // Layered natural spines across the upper back, avoiding the face and underside.
    for (let row = 0; row < 7; row++) {
      const x = -0.77 + row * 0.145, f = (x + 0.16) / 0.76;
      const section = Math.sqrt(Math.max(0.12, 1 - f * f));
      for (let j = 0; j < 11; j++) {
        const a = -1.18 + j * 0.236 + (row % 2) * 0.04;
        const b = [x, 0.74 + Math.cos(a) * 0.53 * section, Math.sin(a) * 0.52 * section];
        const t = [b[0] - 0.15, b[1] + Math.cos(a) * 0.29, b[2] + Math.sin(a) * 0.25];
        cone(m, b, t, 0.055, 0.32 + (j % 3) * 0.08);
      }
    }
    return m.build();
  }
  function beaver() {
    const m = new Mesh();
    ellipsoid(m, [-0.53, 0.16, 0], [0.56, 0.11, 0.30], 0.4);
    ellipsoid(m, [0, 0.76, 0], [0.42, 0.60, 0.36], 0.55);
    // Vest silhouette, hanging arms and two broad incisors.
    box(m, [0, 0.86, 0], [0.70, 0.68, 0.63], 0.65);
    for (const z of [-0.33, 0.33]) {
      ellipsoid(m, [0.02, 0.19, z], [0.29, 0.19, 0.16], 0.42);
      ellipsoid(m, [0.08, 0.83, z * 1.28], [0.14, 0.37, 0.13], 0.5);
      ellipsoid(m, [-0.02, 1.59, z * 0.82], [0.15, 0.18, 0.10], 0.5);
      ellipsoid(m, [0.30, 1.41, z * 0.78], [0.13, 0.14, 0.10], 1);
      ellipsoid(m, [0.395, 1.41, z * 0.78], [0.045, 0.07, 0.06], 0.1);
    }
    ellipsoid(m, [0, 1.35, 0], [0.40, 0.39, 0.37], 0.55);
    ellipsoid(m, [0.34, 1.20, 0], [0.22, 0.19, 0.26], 0.95);
    ellipsoid(m, [0.51, 1.31, 0], [0.12, 0.10, 0.14], 0.1);
    for (const z of [-0.065, 0.065]) box(m, [0.49, 1.08, z], [0.10, 0.23, 0.11], 1);
    return m.build();
  }
  function tractor() {
    const m = new Mesh();
    box(m, [-0.20, 0.48, 0], [2.5, 0.22, 1.1], 0.3);
    box(m, [0.70, 0.92, 0], [1.1, 0.65, 0.86], 0.85);
    box(m, [-0.38, 1.89, 0], [1.3, 0.12, 1.28], 0.9);
    for (const x of [-0.95, 0.1]) for (const z of [-0.5, 0.5]) box(m, [x, 1.40, z], [0.06, 0.94, 0.06], 0.25);
    for (const z of [-0.28, 0.28]) { box(m, [-0.45, 0.89, z], [0.47, 0.12, 0.36], 0.35); box(m, [-0.65, 1.12, z], [0.10, 0.45, 0.36], 0.35); }
    for (const x of [-0.85, 0.88]) for (const z of [-0.61, 0.61]) ellipsoid(m, [x, 0.40, z], [0.38, 0.40, 0.16], 0.13, 16, 8);
    box(m, [-2.25, 0.46, 0], [1.50, 0.15, 1.20], 0.75);
    for (const z of [-0.56, 0.56]) box(m, [-2.25, 0.67, z], [1.50, 0.30, 0.07], 0.7);
    for (const z of [-0.62, 0.62]) ellipsoid(m, [-2.35, 0.27, z], [0.27, 0.27, 0.13], 0.13, 12, 8);
    box(m, [-1.43, 0.42, 0], [0.30, 0.10, 0.12], 0.35);
    // Folded crane and dark grapple, empty trailer.
    m.sweep([[-1.05, 0.7, 0], [-1.05, 1.55, 0], [-1.85, 1.30, 0], [-1.60, 0.85, 0]], 0.13, 0.13, () => [0, 0, 1]);
    for (const z of [-0.12, 0.12]) cone(m, [-1.60, 0.83, z], [-1.53, 0.63, z * 0.4], 0.06, 0.15);
    return m.build();
  }
  function bridge() {
    const m = new Mesh();
    for (let x = -1.7; x <= 1.701; x += 0.2) box(m, [x, 0.19, 0], [0.18, 0.12, 1.28], 0.7);
    for (const z of [-0.72, 0.72]) {
      for (const x of [-1.6, 0, 1.6]) box(m, [x, 0.51, z], [0.10, 1.02, 0.10], 0.5);
      box(m, [0, 0.88, z], [3.4, 0.09, 0.09], 0.65);
      box(m, [0, 0.09, z * 0.7], [3.6, 0.14, 0.12], 0.55);
    }
    box(m, [1.88, 0.13, 0], [0.38, 0.10, 1.28], 0.85); // last small-paw approach plank
    return m.build();
  }
  function tree() {
    const m = new Mesh();
    m.tube([[-1.6, 0.42, -0.3], [-0.6, 0.38, 0], [0.55, 0.42, 0.2], [1.7, 0.31, 0.4]], k => 0.32 - k * 0.055, 10, true);
    for (const s of [-1, 1]) {
      m.tube([[-1.5, 0.4, -0.3], [-1.82, 0.22, s * 0.52], [-1.9, 0.04, s * 0.76]], k => 0.13 - k * 0.045, 6);
      m.tube([[0.1, 0.4, 0.1], [0.45, 0.8, s * 0.56], [0.8, 0.93, s * 0.85]], k => 0.1 - k * 0.035, 6);
    }
    // Woodland companions, their trunks leave generous gaps around the route.
    for (const [x, z] of [[-1.3, 1.0], [1.3, -1.0]]) {
      m.tube([[x, 0, z], [x + 0.1, 1.4, z], [x, 2.1, z]], k => 0.12 - k * 0.025, 8);
      ellipsoid(m, [x, 1.9, z], [0.55, 0.55, 0.48], 0.65, 12, 8);
    }
    const mesh = m.build(), vertices = new Float32Array(mesh.vb);
    let base = Infinity;
    for (let i = 0; i < mesh.nv; i++) base = Math.min(base, vertices[i * 4 + 1]);
    for (let i = 0; i < mesh.nv; i++) vertices[i * 4 + 1] -= base;
    return mesh;
  }
  const piece = (name, build, position, color, rotation = [0, 0, 0]) => ({
    name, asset: name, build, position, rotation, scale: [1, 1, 1], color
  });
  return [
    piece('pinpin', pinpin, [0, 0, 4], [0.76, 0.57, 0.34], [0, -0.4, 0]),
    piece('beaver', beaver, [-4.5, 0, 0], [0.36, 0.48, 0.57], [0, -0.3, 0]),
    piece('timber-tractor', tractor, [-7, 0.02, -3], [0.72, 0.18, 0.12], [0, 0.35, 0]),
    piece('footbridge', bridge, [5, 0, -7], [0.56, 0.38, 0.21], [0, 0.35, 0]),
    piece('windfallen-tree', tree, [9, 0, -3], [0.34, 0.25, 0.12], [0, -0.4, 0])
  ];
}
