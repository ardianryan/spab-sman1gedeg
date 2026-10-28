import roofData from "../data/roof-plan.json";
import { campus } from "./model";
import { composeAffine, invertAffine, project, registrationFit, type XY } from "./registration";

export const oldToAerial = composeAffine(invertAffine(registrationFit("aerial").matrix), registrationFit("campus").matrix);
export const oldFootprints = [
  ...campus.buildings.map((b) => ({ id: b.id, code: b.code, polygon: b.polygon.map((p) => project(p as XY, oldToAerial)) })),
  ...campus.access.buildingParts.map((b) => ({ id: b.id, code: b.buildingId, polygon: b.polygon.map((p) => project(p as XY, oldToAerial)) })),
];
export function correspondingFootprints(roofId: string) {
  const roof = roofData.roofs.find((r) => r.id === roofId);
  if (!roof) return [];
  if (roofId === "R15") return oldFootprints.filter((p) => p.id === "O-ANNEX");
  return oldFootprints.filter((p) => roof.buildingCodes.includes(p.id));
}
function contains([x, y]: XY, polygon: number[][]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
// Sample both shapes in aerial pixels; the score compares an old footprint with a roof, not measured walls.
export function overlapFor(roofId: string) {
  const roof = roofData.roofs.find((r) => r.id === roofId);
  const old = correspondingFootprints(roofId);
  if (!roof || !old.length) return null;
  const vertices = [roof.polygon, ...old.map((p) => p.polygon)].flat();
  const minX = Math.floor(Math.min(...vertices.map((p) => p[0]))), maxX = Math.ceil(Math.max(...vertices.map((p) => p[0])));
  const minY = Math.floor(Math.min(...vertices.map((p) => p[1]))), maxY = Math.ceil(Math.max(...vertices.map((p) => p[1])));
  let a = 0, b = 0, both = 0;
  for (let x = minX + .5; x < maxX; x += 2) for (let y = minY + .5; y < maxY; y += 2) {
    const inRoof = contains([x, y], roof.polygon), inOld = old.some((p) => contains([x, y], p.polygon));
    if (inRoof) a++;
    if (inOld) b++;
    if (inRoof && inOld) both++;
  }
  return { oldCoveragePercent: b ? Math.round(both / b * 100) : 0, intersectionOverUnionPercent: a + b - both ? Math.round(both / (a + b - both) * 100) : 0, samplingStepPixels: 2 };
}
