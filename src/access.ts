import { z } from "zod";
const p = z.tuple([z.number().finite(), z.number().finite()]);
export const accessSchema = z.object({
  recordedAt: z.string(),
  status: z.literal("user-confirmed"),
  precision: z.literal("schematic"),
  policies: z.array(
    z.object({
      buildingId: z.string(),
      description: z.string(),
      source: z.string(),
    }),
  ),
  doors: z.array(
    z.object({
      id: z.string(),
      buildingId: z.string(),
      floor: z.number().int().positive(),
      position: p,
      localPosition: p.nullable(),
      source: z.string(),
      leaves: z.union([z.literal(1), z.literal(2)]),
      motion: z.enum(["swing", "sliding"]),
      swing: z.enum(["inward", "outward", "both"]).nullable(),
      material: z.string().nullable(),
      marker: z.boolean(),
      precision: z.literal("schematic"),
      note: z.string(),
      roomIds: z.array(z.string()),
      connectionStatus: z.enum(["incomplete", "connected"]),
    }),
  ),
  walls: z.array(
    z.object({
      buildingId: z.string(),
      source: z.string(),
      points: z.array(p).length(2),
    }),
  ),
  floorPlans: z.array(
    z.object({
      id: z.string(),
      floor: z.number(),
      source: z.string(),
      viewBox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
      footprints: z.array(
        z.object({ buildingId: z.string(), polygon: z.array(p) }),
      ),
      walls: z.array(z.array(p).length(2)),
      corridor: z.array(p),
    }),
  ),
  rooms: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      buildingId: z.string(),
      floor: z.number(),
      polygon: z.array(p),
      doorIds: z.array(z.string()),
      source: z.string(),
      note: z.string(),
    }),
  ),
  buildingParts: z.array(
    z.object({
      id: z.string(),
      buildingId: z.string(),
      name: z.string(),
      polygon: z.array(p),
      source: z.string(),
    }),
  ),
  gates: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      position: p,
      condition: z.enum(["normal", "staff-opened"]),
      source: z.string(),
    }),
  ),
  nodes: z.array(
    z.object({
      id: z.string(),
      position: p,
      floor: z.number().int(),
      kind: z.enum(["junction", "stairs", "open"]),
      source: z.string(),
    }),
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      fromId: z.string(),
      toId: z.string(),
      kind: z.enum(["corridor", "stairs", "level-exit", "crossing"]),
      points: z.array(p).min(2),
      condition: z.enum(["normal", "staff-opened"]),
      source: z.string(),
      direction: z.literal("both"),
      review: z.null(),
    }),
  ),
});
export type Door = z.infer<typeof accessSchema>["doors"][number];
export type Access = z.infer<typeof accessSchema>;
export type Condition = "normal" | "crowded" | "blocked";
export function doorDescription(d: Door) {
  return `${d.leaves} daun${d.material === "glass" ? " kaca" : ""} · ${d.motion === "sliding" ? "geser kanan–kiri" : d.swing === "both" ? "ayun dua arah" : d.swing === "inward" ? "membuka ke dalam" : "membuka ke luar"}`;
}
export function validateAccess(
  a: Access,
  buildings: string[],
  sources: string[],
) {
  const errors: string[] = [];
  for (const list of [
    a.doors,
    a.nodes,
    a.edges,
    a.rooms,
    a.gates,
    a.buildingParts,
  ])
    if (new Set(list.map((x) => x.id)).size !== list.length)
      errors.push("ID akses duplikat.");
  for (const x of [
    ...a.doors,
    ...a.nodes,
    ...a.edges,
    ...a.rooms,
    ...a.gates,
    ...a.buildingParts,
    ...a.walls,
    ...a.floorPlans,
    ...a.policies,
  ])
    if (!sources.includes(x.source))
      errors.push("Sumber akses tidak ditemukan.");
  for (const x of [...a.doors, ...a.rooms, ...a.buildingParts, ...a.policies])
    if (!buildings.includes(x.buildingId))
      errors.push("Gedung akses tidak ditemukan.");
  for (const d of a.doors) {
    if (d.buildingId === "A1") errors.push("A1 terbuka tanpa pintu.");
    if ((d.motion === "sliding") !== (d.swing === null))
      errors.push(`Gerak pintu tidak konsisten: ${d.id}`);
  }
  for (const r of a.rooms)
    for (const id of r.doorIds)
      if (!a.doors.some((d) => d.id === id))
        errors.push(`Pintu ruang tidak ditemukan: ${id}`);
  for (const e of a.edges) {
    const from = a.nodes.find((n) => n.id === e.fromId),
      to = a.nodes.find((n) => n.id === e.toId);
    if (!from || !to) {
      errors.push(`Simpul akses tidak ditemukan: ${e.id}`);
      continue;
    }
    if (
      from.floor !== to.floor &&
      !(
        e.kind === "stairs" &&
        from.kind === "stairs" &&
        to.kind === "stairs" &&
        Math.abs(from.floor - to.floor) === 1
      ) &&
      !(
        e.kind === "level-exit" &&
        Math.min(from.floor, to.floor) === 0 &&
        Math.max(from.floor, to.floor) === 1
      )
    )
      errors.push(`Lompatan lantai: ${e.id}`);
    if (
      e.points[0].some((v, i) => v !== from.position[i]) ||
      e.points.at(-1)!.some((v, i) => v !== to.position[i])
    )
      errors.push(`Garis akses terputus: ${e.id}`);
    if (
      (e.fromId === "gate-right" || e.toId === "gate-right") &&
      e.condition !== "staff-opened"
    )
      errors.push("Gerbang kanan harus dibuka petugas.");
  }
  return errors;
}
export function activeDestinations(scenario: string, condition: Condition) {
  return scenario === "wind"
    ? []
    : condition === "normal"
      ? ["KU"]
      : ["K1", "K2"];
}
