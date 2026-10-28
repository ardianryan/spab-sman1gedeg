import { test } from "node:test";
import assert from "node:assert/strict";
import roof from "../data/roof-plan.json";
import campus from "../data/campus.json";
import { project, registrationFit, type XY } from "../src/registration";

test("atap memiliki ID unik, geometri terbatas pada sumber, dan kode sementara yang dikenal", () => {
  assert.equal(new Set(roof.roofs.map((r) => r.id)).size, roof.roofs.length);
  for (const r of [...roof.roofs, ...roof.grounds]) {
    assert.ok(r.polygon.length >= 3);
    assert.ok(r.polygon.every(([x, y]) => x >= 0 && x <= 768 && y >= 0 && y <= 1376));
    const area = r.polygon.reduce((sum, p, i, all) => {
      const q = all[(i + 1) % all.length];
      return sum + p[0] * q[1] - p[1] * q[0];
    }, 0) / 2;
    assert.ok(Math.abs(area) > 1, r.id);
  }
  for (const r of roof.roofs) for (const code of r.buildingCodes) {
    assert.ok(campus.buildings.some((b) => b.code === code));
  }
  assert.ok(!roof.roofs.some((r) => r.buildingCodes.includes("A1")));
  assert.equal(roof.status, "draft");
});

test("penelusuran atap mempertahankan bidang gabungan dan menghasilkan proyeksi citra yang berhingga", () => {
  assert.ok(roof.roofs.some((r) => r.buildingCodes.includes("D") && r.buildingCodes.includes("E")));
  assert.equal(roof.roofs.filter((r) => r.buildingCodes.includes("O")).length, 2);
  const fit = registrationFit("aerial");
  for (const r of roof.roofs) for (const p of r.polygon) {
    assert.ok(project(p as XY, fit.matrix).every(Number.isFinite));
  }
});
