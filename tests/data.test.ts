import { test } from "node:test";
import assert from "node:assert/strict";
import {
  campus,
  campusSchema,
  validateCampus,
  routesFor,
  onTrace,
  traceIntersections,
} from "../src/model";
test("data sumber valid dan geometri jejak tidak memotong tapak bangunan", () => {
  assert.deepEqual(validateCampus(campus), []);
  assert.deepEqual(traceIntersections(campus), []);
});
test("data belum disahkan tidak dapat dirilis operasional", () => {
  const errors = validateCampus(campus, true);
  assert.ok(errors.some((e) => e.includes("ditahan")));
  assert.ok(errors.some((e) => e.includes("Belum ada rute")));
});
test("mengganti label versi tidak dapat melewati gerbang verifikasi", () => {
  const d = structuredClone(campus);
  d.meta.status = "operational";
  d.meta.review = { role: "Tim SPAB", date: "2026-10-20", evidence: "test" };
  assert.ok(validateCampus(d, true).length > 0);
});
test("rute kosong tidak ditebak dari jejak terdekat", () => {
  for (const b of campus.buildings)
    for (const s of campus.scenarios)
      assert.deepEqual(routesFor(campus, b.id, s.id), []);
});
test("referensi skenario rusak ditolak", () => {
  const d = structuredClone(campus);
  d.scenarios[1].routeIds = ["hilang"];
  assert.ok(validateCampus(d).some((e) => e.includes("tidak ditemukan")));
});
test("rute dengan gedung, simpul, tujuan, SOP yang hilang ditolak", () => {
  const d = structuredClone(campus);
  d.routes.push({
    id: "broken",
    source: "map",
    verified: false,
    review: null,
    originBuildingId: "missing",
    destinationId: "missing",
    scenarioId: "missing",
    category: "utama",
    nodeIds: ["a", "b"],
  });
  assert.ok(validateCampus(d).length >= 3);
});
test("sumber tidak diketahui dan ID ganda ditolak", () => {
  const d = structuredClone(campus);
  d.buildings[0].source = "missing";
  d.buildings.push(d.buildings[0]);
  assert.ok(validateCampus(d).some((e) => e.includes("duplikat")));
  assert.ok(validateCampus(d).some((e) => e.includes("Sumber")));
});
test("koordinat kosong dan bentuk tidak lengkap ditolak", () => {
  const d = structuredClone(campus);
  d.buildings[0].polygon = [];
  assert.equal(campusSchema.safeParse(d).success, false);
});
test("panah mengikuti titik awal dan akhir dengan arah yang benar", () => {
  assert.deepEqual(
    onTrace(
      [
        [0, 0],
        [10, 0],
      ],
      0,
    ),
    { x: 0, y: 0, angle: 0 },
  );
  assert.deepEqual(
    onTrace(
      [
        [0, 0],
        [10, 0],
      ],
      1,
    ),
    { x: 10, y: 0, angle: 0 },
  );
});

test("pengecualian pintu tetap spesifik dan tidak tertimpa aturan umum", () => {
  const door = (id: string) => campus.access.doors.find((d) => d.id === id)!;
  assert.equal(door("O1-D01").motion, "sliding");
  assert.equal(door("O1-D01").leaves, 2);
  assert.equal(door("O1-D01").swing, null);
  assert.equal(door("O1-D02").swing, "outward");
  assert.equal(door("O1-D02").leaves, 2);
  assert.equal(door("M1-D01").leaves, 1);
  assert.equal(door("M1-D02").leaves, 2);
  assert.equal(door("C1-D01").motion, "sliding");
  assert.equal(door("A1-D01").leaves, 1);
  assert.equal(door("A1-D01").swing, "inward");
  assert.deepEqual(
    campus.access.doors.filter((d) => d.swing === "both").map((d) => d.id),
    ["G1-D03"],
  );
  assert.equal(door("H1-D01").leaves, 1);
  for (const id of ["H1-D02", "H1-D03", "H1-D04"]) {
    assert.equal(door(id).leaves, 2);
    assert.equal(door(id).swing, "outward");
  }
  assert.ok(
    campus.access.doors
      .filter((d) => d.buildingId === "H" && d.floor === 2)
      .every((d) => d.leaves === 2 && d.swing === "outward"),
  );
  assert.ok(
    campus.access.doors
      .filter((d) => d.buildingId === "G" && d.floor === 2)
      .every((d) => d.swing === "inward"),
  );
});
test("satu tanda cyan menjadi satu bukaan, abu-abu tidak menjadi pintu", () => {
  assert.equal(
    campus.access.doors.filter((d) => d.source === "gh1" && d.marker).length,
    8,
  );
  assert.equal(
    campus.access.doors.filter((d) => d.source === "gh2" && d.marker).length,
    6,
  );
  assert.equal(
    campus.access.doors.find((d) => d.id === "H1-D01")?.source,
    "gh1",
  );
  assert.equal(
    campus.access.doors.filter((d) => d.buildingId === "A1").length,
    0,
  );
  assert.equal(campus.buildings.find((b) => b.id === "A1")?.structure, "open");
});
test("O terpisah masih bagian O dan UKS berada pada sambungan F–I", () => {
  assert.equal(
    campus.access.buildingParts.find((p) => p.id === "O-ANNEX")?.buildingId,
    "O",
  );
  assert.equal(
    campus.unidentified.some((b) => b.id === "U9"),
    false,
  );
  assert.equal(
    campus.access.rooms.find((r) => r.id === "UKS")?.doorIds[0],
    "F1-D02",
  );
});
test("lompatan lantai, simpul putus, dan pembukaan gerbang kanan tanpa syarat ditolak", () => {
  const d = structuredClone(campus);
  d.access.edges.push({
    id: "bad",
    fromId: "stair-G-2",
    toId: "KU",
    kind: "corridor",
    points: [
      [548, 450],
      [530, 60],
    ],
    condition: "normal",
    source: "user",
    direction: "both",
    review: null,
  });
  assert.ok(validateCampus(d).some((e) => e.includes("Lompatan lantai")));
  const e = structuredClone(campus);
  e.access.edges.find((e) => e.id === "A1-right")!.condition = "normal";
  assert.ok(validateCampus(e).some((e) => e.includes("Gerbang kanan")));
  const f = structuredClone(campus);
  f.access.edges[0].points[0] = [0, 0];
  assert.ok(validateCampus(f).some((e) => e.includes("terputus")));
});
import { activeDestinations } from "../src/access";
test("angin kencang tidak menawarkan lapangan dan titik sementara bersyarat", () => {
  for (const c of ["normal", "crowded", "blocked"] as const)
    assert.deepEqual(activeDestinations("wind", c), []);
  assert.deepEqual(activeDestinations("earthquake", "normal"), ["KU"]);
  assert.deepEqual(activeDestinations("earthquake", "blocked"), ["K1", "K2"]);
});

import {
  fitAffine,
  project,
  registrationFit,
  registration,
} from "../src/registration";
test("transformasi citra memulihkan pasangan sintetis dan menolak titik segaris", () => {
  const pairs = [
    { from: [0, 0] as [number, number], to: [10, 20] as [number, number] },
    { from: [1, 0] as [number, number], to: [12, 20] as [number, number] },
    { from: [0, 1] as [number, number], to: [10, 23] as [number, number] },
    { from: [1, 1] as [number, number], to: [12, 23] as [number, number] },
  ];
  const m = fitAffine(pairs);
  const q = project([4, 5], m);
  assert.ok(Math.abs(q[0] - 18) < 1e-8 && Math.abs(q[1] - 35) < 1e-8);
  assert.throws(() =>
    fitAffine([
      { from: [0, 0], to: [0, 0] },
      { from: [1, 1], to: [2, 2] },
      { from: [2, 2], to: [4, 4] },
    ]),
  );
  for (const kind of ["campus", "aerial"] as const) {
    const f = registrationFit(kind);
    assert.equal(f.residuals.length, 6);
    assert.ok(Number.isFinite(f.rmse));
  }
  assert.equal(registration.anchor.feature, "Tengah lapangan upacara");
});
test("garis pembagian lurus dua titik dan memiliki gedung induk", () => {
  for (const w of campus.access.walls) {
    assert.equal(w.points.length, 2);
    assert.ok(campus.buildings.some((b) => b.id === w.buildingId));
  }
  for (const f of campus.access.floorPlans)
    for (const [a, b] of f.walls) assert.ok(a[0] === b[0] || a[1] === b[1]);
});

test("koreksi B tengah, L tiga ruang, dan K tiga ruang tercatat", () => {
  for (const b of ["B", "L", "K"]) {
    assert.equal(
      campus.access.rooms.filter((r) => r.buildingId === b).length,
      3,
    );
    const doors = campus.access.doors.filter((d) => d.buildingId === b);
    assert.equal(doors.length, 3);
    assert.ok(doors.every((d) => d.leaves === 2 && d.swing === "outward"));
    assert.ok(doors.every((d) => d.roomIds.length === 1));
  }
  const middle = campus.access.rooms.find((r) => r.id === "B-02")!;
  assert.deepEqual(middle.doorIds, ["B1-D03"]);
  assert.equal(
    campus.access.walls.filter((w) => w.buildingId === "L").length,
    2,
  );
});

test("pintu K mengikuti koreksi kiri bawah, bukan posisi kanan lama", () => {
  for (const door of campus.access.doors.filter((d) => d.buildingId === "K")) {
    const room = campus.access.rooms.find((r) => r.id === door.roomIds[0])!;
    assert.ok(
      door.position[0] <
        room.polygon.reduce((s, p) => s + p[0], 0) / room.polygon.length,
    );
    assert.equal(door.source, "user-k-correction");
    assert.match(door.note, /sisi kiri, dekat ujung bawah/);
  }
});

test("taman merupakan penghalang dan ujung jejak lama yang menembus taman ditolak", () => {
  assert.equal(campus.obstacles.length, 2);
  const d = structuredClone(campus);
  d.referenceTraces.find((t) => t.id === "T5")!.points.at(-1)![0] = 525;
  assert.ok(traceIntersections(d).some((e) => e.includes("garden-west")));
  assert.ok(validateCampus(d).length > 0);
});
