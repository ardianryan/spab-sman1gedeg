import { fitAffine, project, type Affine, type XY } from "./registration";
import { registration } from "./registration";

export type GeoPoint = { id: string; label: string; latitude: number; longitude: number; campus: XY };
export type GeoFix = { latitude: number; longitude: number; accuracy: number };
const key = "spab-gedeg-geocalibration-v1";
const anchor: GeoPoint = {
  id: "lapangan-upacara",
  label: "Tengah lapangan upacara · acuan pengguna",
  latitude: registration.anchor.latitude,
  longitude: registration.anchor.longitude,
  campus: registration.anchor.campusPosition as XY,
};
const origin = [anchor.latitude, anchor.longitude] as const;
const northMeters = 110574;
const eastMeters = 111320 * Math.cos((origin[0] * Math.PI) / 180);
export function toMeters(latitude: number, longitude: number): XY {
  return [(longitude - origin[1]) * eastMeters, (latitude - origin[0]) * northMeters];
}
export function fromMeters(east: number, north: number): [number, number] {
  return [origin[0] + north / northMeters, origin[1] + east / eastMeters];
}
export function initialGeoPoints(): GeoPoint[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(parsed)) return [anchor];
    const valid = parsed.filter((p): p is GeoPoint =>
      p && typeof p.id === "string" && typeof p.label === "string" &&
      Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90 &&
      Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180 &&
      Array.isArray(p.campus) && p.campus.length === 2 &&
      p.campus.every(Number.isFinite),
    );
    return [anchor, ...valid.filter((p) => p.id !== anchor.id).slice(0, 20)];
  } catch {
    return [anchor];
  }
}
export function saveGeoPoints(points: GeoPoint[]) {
  localStorage.setItem(key, JSON.stringify(points.filter((p) => p.id !== anchor.id)));
}
export function calibration(points: GeoPoint[]): { matrix: Affine; rmse: number } | null {
  if (points.length < 4) return null;
  const pairs = points.map((p) => ({ from: toMeters(p.latitude, p.longitude), to: p.campus }));
  const span = Math.max(...pairs.flatMap((a) => pairs.map((b) => Math.hypot(a.from[0] - b.from[0], a.from[1] - b.from[1]))));
  if (span < 25) return null;
  try {
    const matrix = fitAffine(pairs);
    if (Math.abs(matrix[0] * matrix[3] - matrix[1] * matrix[2]) < 0.01) return null;
    const residuals = pairs.map((p) => Math.hypot(...project(p.from, matrix).map((v, i) => v - p.to[i])));
    const rmse = Math.hypot(...residuals) / Math.sqrt(residuals.length);
    if (!Number.isFinite(rmse) || rmse > 40) return null;
    return { matrix, rmse };
  } catch {
    return null;
  }
}
export function locateOnCampus(fix: GeoFix, matrix: Affine): XY {
  return project(toMeters(fix.latitude, fix.longitude), matrix);
}
export function accuracyOutline(fix: GeoFix, matrix: Affine): XY[] {
  const center = toMeters(fix.latitude, fix.longitude);
  return Array.from({ length: 48 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 48;
    return project([center[0] + fix.accuracy * Math.cos(angle), center[1] + fix.accuracy * Math.sin(angle)], matrix);
  });
}
