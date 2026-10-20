import { accessSchema, validateAccess } from "./access";
import { z } from "zod";
import raw from "../data/campus.json";
export const point = z.tuple([z.number().finite(), z.number().finite()]);
const review = z
  .object({
    role: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    evidence: z.string().min(1),
  })
  .nullable();
const traced = z.object({ source: z.string(), verified: z.boolean() });
export const campusSchema = z.object({
  access: accessSchema,
  obstacles: z.array(
    traced.extend({
      id: z.string(),
      name: z.string(),
      kind: z.literal("garden"),
      polygon: z.array(point).min(3),
    }),
  ),
  meta: z.object({
    version: z.string(),
    date: z.string(),
    status: z.enum(["draft", "operational"]),
    school: z.string(),
    warning: z.string().min(1),
    coordinateSystem: z.string(),
    viewBox: z.tuple([
      z.number(),
      z.number(),
      z.number().positive(),
      z.number().positive(),
    ]),
    review,
  }),
  sources: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      kind: z.string(),
      note: z.string(),
    }),
  ),
  buildings: z
    .array(
      traced.extend({
        structure: z.enum(["open", "enclosed"]),
        floorCount: z.number().nullable(),
        id: z.string(),
        code: z.string(),
        name: z.string().nullable(),
        polygon: z.array(point).min(3),
        label: point,
        heightMeters: z.number().positive().nullable(),
        entrances: z.array(z.string()),
      }),
    )
    .min(1),
  unidentified: z.array(
    z.object({ id: z.string(), polygon: z.array(point).min(3) }),
  ),
  grounds: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      polygon: z.array(point).min(3),
      label: point,
    }),
  ),
  destinations: z.array(
    traced.extend({
      id: z.string(),
      name: z.string(),
      position: point,
      role: z.enum(["primary", "temporary"]),
      scenarioIds: z.array(z.string()),
      condition: z.string(),
      capacity: z.number().positive().nullable(),
      review,
    }),
  ),
  accessNodes: z.array(
    traced.extend({
      id: z.string(),
      position: point,
      kind: z.enum(["entrance", "junction", "ramp", "stairs"]),
      review,
    }),
  ),
  routes: z.array(
    traced.extend({
      id: z.string(),
      originBuildingId: z.string(),
      destinationId: z.string(),
      scenarioId: z.string(),
      nodeIds: z.array(z.string()).min(2),
      category: z.enum(["utama", "alternatif"]),
      review,
    }),
  ),
  referenceTraces: z.array(
    traced.extend({
      id: z.string(),
      category: z.enum(["utama", "alternatif"]),
      name: z.string(),
      points: z.array(point).min(2),
      originBuildingId: z.string().nullable(),
      destinationId: z.string().nullable(),
    }),
  ),
  facilities: z.array(
    traced.extend({
      id: z.string(),
      name: z.string(),
      quantity: z.number(),
      locationText: z.string(),
      position: point.nullable(),
    }),
  ),
  hazards: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      locationText: z.string(),
      position: point.nullable(),
      source: z.string(),
    }),
  ),
  scenarios: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      instruction: z.string(),
      routeIds: z.array(z.string()),
      verified: z.boolean(),
      review,
    }),
  ),
  uncertainties: z.array(z.string()),
});
export type Campus = z.infer<typeof campusSchema>;
export type Point = z.infer<typeof point>;
export type Trace = Campus["referenceTraces"][number];
export type Layers = {
  buildings: boolean;
  destinations: boolean;
  facilities: boolean;
  hazards: boolean;
  traces: boolean;
  doors: boolean;
  walls: boolean;
  corridors: boolean;
  stairs: boolean;
  gates: boolean;
  obstacles: boolean;
};
export const defaultLayers: Layers = {
  doors: true,
  walls: true,
  corridors: true,
  stairs: true,
  gates: true,
  obstacles: true,
  buildings: true,
  destinations: true,
  facilities: false,
  hazards: false,
  traces: true,
};
export const colors = {
  ink: "#183f35",
  main: "#1b704c",
  alternate: "#a36117",
  building: "#d8b9a1",
  selected: "#b65f3a",
  ground: "#dce7d8",
  background: "#f5f3ec",
};
export const campus = campusSchema.parse(raw);
export const pointsString = (p: Point[]) => p.map((v) => v.join(",")).join(" ");
export function onTrace(points: Point[], fraction: number) {
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  let remaining =
    Math.max(0, Math.min(1, fraction)) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] ? remaining / lengths[i] : 0;
      const a = points[i],
        b = points[i + 1];
      return {
        x: a[0] + (b[0] - a[0]) * t,
        y: a[1] + (b[1] - a[1]) * t,
        angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI,
      };
    }
    remaining -= lengths[i];
  }
  return { x: points[0][0], y: points[0][1], angle: 0 };
}
export function inside(p: Point, poly: Point[]) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      hit = !hit;
  }
  return hit;
}
export function traceIntersections(data: Campus) {
  const result: string[] = [];
  for (const t of data.referenceTraces)
    for (let i = 1; i < t.points.length; i++) {
      const a = t.points[i - 1],
        b = t.points[i],
        steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]));
      for (let j = 0; j <= steps; j++) {
        const p: Point = [
          a[0] + ((b[0] - a[0]) * j) / steps,
          a[1] + ((b[1] - a[1]) * j) / steps,
        ];
        const collision = [
          ...data.buildings,
          ...data.unidentified,
          ...data.obstacles,
        ].find((x) => inside(p, x.polygon));
        if (collision) {
          result.push(`${t.id} traverse ${collision.id}`);
          break;
        }
      }
    }
  return [...new Set(result)];
}
export function validateCampus(data: Campus, operational = false) {
  const errors: string[] = validateAccess(
    data.access,
    data.buildings.map((b) => b.id),
    data.sources.map((s) => s.id),
  );
  const collections = [
    data.sources,
    data.obstacles,
    data.buildings,
    data.unidentified,
    data.destinations,
    data.accessNodes,
    data.routes,
    data.referenceTraces,
    data.scenarios,
    data.facilities,
    data.hazards,
  ];
  for (const list of collections)
    if (new Set(list.map((x) => x.id)).size !== list.length)
      errors.push("ID duplikat dalam koleksi.");
  for (const item of [
    ...data.obstacles,
    ...data.buildings,
    ...data.destinations,
    ...data.accessNodes,
    ...data.routes,
    ...data.referenceTraces,
    ...data.facilities,
    ...data.hazards,
  ])
    if (!data.sources.some((s) => s.id === item.source))
      errors.push(`Sumber tidak ditemukan: ${item.id}`);
  for (const b of data.buildings)
    for (const e of b.entrances)
      if (!data.accessNodes.some((n) => n.id === e && n.kind === "entrance"))
        errors.push(`Pintu tidak ditemukan: ${b.id}/${e}`);
  for (const r of data.routes) {
    const b = data.buildings.find((b) => b.id === r.originBuildingId),
      destination = data.destinations.find((d) => d.id === r.destinationId),
      scenario = data.scenarios.find((s) => s.id === r.scenarioId);
    if (!b || !destination || !scenario)
      errors.push(`Referensi rute rusak: ${r.id}`);
    if (!b?.entrances.includes(r.nodeIds[0]))
      errors.push(`Rute tidak dimulai di pintu gedung: ${r.id}`);
    if (r.nodeIds.some((id) => !data.accessNodes.some((n) => n.id === id)))
      errors.push(`Simpul tidak ditemukan: ${r.id}`);
    const last = data.accessNodes.find((n) => n.id === r.nodeIds.at(-1));
    if (
      destination &&
      last &&
      Math.hypot(
        last.position[0] - destination.position[0],
        last.position[1] - destination.position[1],
      ) > 1
    )
      errors.push(`Rute tidak berakhir pada tujuan: ${r.id}`);
    if (!scenario?.routeIds.includes(r.id))
      errors.push(`Rute tidak terdaftar dalam skenario: ${r.id}`);
  }
  for (const s of data.scenarios)
    for (const id of s.routeIds)
      if (!data.routes.some((r) => r.id === id && r.scenarioId === s.id))
        errors.push(`Rute skenario tidak ditemukan: ${id}`);
  errors.push(
    ...traceIntersections(data).map((x) => `Jejak menembus bangunan: ${x}`),
  );
  for (const edge of data.access.edges.filter(
    (e) => e.kind === "corridor" || e.kind === "crossing",
  )) {
    const node = data.access.nodes.find((n) => n.id === edge.fromId);
    const footprints = data.buildings.filter(
      (b) =>
        b.structure !== "open" && (node?.floor !== 2 || b.floorCount === 2),
    );
    const blocking = [
      ...footprints,
      ...(node?.floor === 2 ? [] : data.obstacles),
    ];
    let hit = false;
    for (let i = 1; i < edge.points.length && !hit; i++) {
      const a = edge.points[i - 1],
        b = edge.points[i],
        steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])));
      for (let j = 0; j <= steps; j++)
        if (
          blocking.some((f) =>
            inside(
              [
                a[0] + ((b[0] - a[0]) * j) / steps,
                a[1] + ((b[1] - a[1]) * j) / steps,
              ],
              f.polygon,
            ),
          )
        ) {
          errors.push(
            `Koridor menembus bangunan tanpa akses ruang tercatat: ${edge.id}`,
          );
          hit = true;
          break;
        }
    }
  }
  if (operational || data.meta.status === "operational") {
    if (data.meta.status !== "operational" || !data.meta.review)
      errors.push("Rilis operasional ditahan: versi belum disetujui.");
    if (data.routes.length === 0) errors.push("Belum ada rute operasional.");
    if (data.uncertainties.length)
      errors.push("Masih ada ketidakpastian yang belum diselesaikan.");
    for (const b of data.buildings)
      if (
        !b.verified ||
        !b.name ||
        (b.structure !== "open" && !b.entrances.length)
      )
        errors.push(`Gedung belum lengkap: ${b.id}`);
    for (const r of data.routes) {
      if (!r.verified || !r.review) errors.push(`Rute belum ditinjau: ${r.id}`);
      const d = data.destinations.find((d) => d.id === r.destinationId),
        s = data.scenarios.find((s) => s.id === r.scenarioId);
      if (!d?.verified || !d.review || !d.capacity || !s?.verified || !s.review)
        errors.push(`Tujuan/SOP belum ditinjau: ${r.id}`);
      for (const id of r.nodeIds) {
        const n = data.accessNodes.find((n) => n.id === id);
        if (!n?.verified || !n.review)
          errors.push(`Akses belum ditinjau: ${id}`);
      }
    }
  }
  return errors;
}
export function routesFor(
  data: Campus,
  building: string | null,
  scenario: string,
) {
  return data.routes.filter(
    (r) =>
      r.originBuildingId === building &&
      r.scenarioId === scenario &&
      r.verified,
  );
}
