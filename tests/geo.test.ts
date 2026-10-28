import { test } from "node:test";
import assert from "node:assert/strict";
import { accuracyOutline, calibration, locateOnCampus, fromMeters, geographicPreview, type GeoPoint } from "../src/geo";
import { approximateCardinalDirections } from "../src/registration";

test("pratinjau tiga patokan tidak mengesahkan GPS atau memakai sudut yang belum pasti sebagai masukan", () => {
  const preview = geographicPreview();
  assert.ok(preview);
  assert.equal(preview.points.length, 3);
  assert.equal(calibration(preview.points), null);
  assert.deepEqual(preview.predictions.map((p) => p.id), ["GEO-BASKET-CORNER", "GEO-EAST-ROOF"]);
  assert.ok(preview.predictions.every((p) => p.projectedCampus.every(Number.isFinite)));
});

test("empat arah mata angin mengikuti pencocokan citra tanpa membalik timur dan barat", () => {
  const { U, T, S, B } = approximateCardinalDirections();
  assert.ok(U[1] < 0 && S[1] > 0);
  assert.ok(T[0] > 0 && B[0] < 0);
  assert.ok(Math.hypot(U[0] + S[0], U[1] + S[1]) < 1e-9);
  assert.ok(Math.hypot(T[0] + B[0], T[1] + B[1]) < 1e-9);
});

test("GPS hanya diproyeksikan setelah empat titik acuan tersebar dan cocok", () => {
  const offsets: [number, number][] = [[0, 0], [30, 0], [0, 35], [35, 30]];
  const points: GeoPoint[] = offsets.map(([east, north], i) => {
    const [latitude, longitude] = fromMeters(east, north);
    return { id: String(i), label: String(i), latitude, longitude, campus: [614 + 2 * east, 625 - 2 * north] };
  });
  assert.equal(calibration(points.slice(0, 3)), null);
  const fitted = calibration(points);
  assert.ok(fitted);
  const [latitude, longitude] = fromMeters(10, 15);
  const fix = { latitude, longitude, accuracy: 10 };
  const position = locateOnCampus(fix, fitted.matrix);
  assert.ok(Math.abs(position[0] - 634) < 0.01);
  assert.ok(Math.abs(position[1] - 595) < 0.01);
  const ring = accuracyOutline(fix, fitted.matrix);
  assert.equal(ring.length, 48);
  assert.ok(Math.abs(ring[0][0] - 654) < 0.01);
  assert.equal(calibration(points.map((p) => ({ ...p, campus: [614, 625] }))), null);
});
