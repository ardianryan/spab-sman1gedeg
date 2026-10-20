import data from "../data/registration.json";
export const registration = data;
export type XY = [number, number];
export type Affine = [number, number, number, number, number, number];
function solve(matrix: number[][], values: number[]) {
  const a = matrix.map((r, i) => [...r, values[i]]);
  for (let i = 0; i < 3; i++) {
    let pivot = i;
    for (let j = i + 1; j < 3; j++)
      if (Math.abs(a[j][i]) > Math.abs(a[pivot][i])) pivot = j;
    [a[i], a[pivot]] = [a[pivot], a[i]];
    const v = a[i][i];
    if (Math.abs(v) < 1e-9)
      throw new Error("Titik pencocokan segaris atau tidak cukup beragam.");
    for (let k = i; k < 4; k++) a[i][k] /= v;
    for (let j = 0; j < 3; j++)
      if (j !== i) {
        const f = a[j][i];
        for (let k = i; k < 4; k++) a[j][k] -= f * a[i][k];
      }
  }
  return a.map((r) => r[3]);
}
export function fitAffine(pairs: { from: XY; to: XY }[]): Affine {
  if (pairs.length < 3)
    throw new Error("Minimal tiga pasangan titik diperlukan.");
  const rows = pairs.map((p) => [...p.from, 1]);
  const normal = [0, 1, 2].map((i) =>
    [0, 1, 2].map((j) => rows.reduce((s, r) => s + r[i] * r[j], 0)),
  );
  const fit = (dim: number) =>
    solve(
      normal,
      [0, 1, 2].map((i) =>
        rows.reduce((s, r, k) => s + r[i] * pairs[k].to[dim], 0),
      ),
    );
  const x = fit(0),
    y = fit(1);
  return [x[0], y[0], x[1], y[1], x[2], y[2]];
}
export function project(p: XY, m: Affine): XY {
  return [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
}
export function invertAffine(m: Affine): Affine {
  const det = m[0] * m[3] - m[1] * m[2];
  if (Math.abs(det) < 1e-9) throw new Error("Transformasi citra tidak dapat dibalik.");
  const a = m[3] / det, b = -m[1] / det, c = -m[2] / det, d = m[0] / det;
  return [a, b, c, d, -a * m[4] - c * m[5], -b * m[4] - d * m[5]];
}
export function composeAffine(outer: Affine, inner: Affine): Affine {
  const origin = project(project([0, 0], inner), outer);
  const x = project(project([1, 0], inner), outer);
  const y = project(project([0, 1], inner), outer);
  return [x[0] - origin[0], x[1] - origin[1], y[0] - origin[0], y[1] - origin[1], origin[0], origin[1]];
}
export function aerialToCampus() {
  return composeAffine(invertAffine(registrationFit("campus").matrix), registrationFit("aerial").matrix);
}
export function approximateNorthDegrees() {
  const inverse = invertAffine(registrationFit("campus").matrix);
  const origin = project([0, 0], inverse);
  const north = project([0, -100], inverse);
  return Math.atan2(north[0] - origin[0], origin[1] - north[1]) * 180 / Math.PI;
}
export function approximateCardinalDirections() {
  const inverse = invertAffine(registrationFit("campus").matrix);
  const origin = project([0, 0], inverse);
  const direction = (satellitePoint: XY): XY => {
    const mapped = project(satellitePoint, inverse);
    const dx = mapped[0] - origin[0], dy = mapped[1] - origin[1];
    const length = Math.hypot(dx, dy);
    return [dx / length, dy / length];
  };
  return {
    U: direction([0, -100]),
    T: direction([100, 0]),
    S: direction([0, 100]),
    B: direction([-100, 0]),
  };
}
export function registrationFit(kind: "campus" | "aerial") {
  const pairs = registration.controlPoints.map((p) => ({
    from: p[kind] as XY,
    to: p.satellite as XY,
  }));
  const matrix = fitAffine(pairs),
    residuals = pairs.map((p) => {
      const q = project(p.from, matrix);
      return Math.hypot(q[0] - p.to[0], q[1] - p.to[1]);
    });
  return {
    matrix,
    residuals,
    rmse: Math.sqrt(
      residuals.reduce((s, r) => s + r * r, 0) / residuals.length,
    ),
  };
}
