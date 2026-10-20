import { FloorArtwork } from "../src/AccessArtwork";
import { doorDescription } from "../src/access";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { campus, validateCampus } from "../src/model";
import { MapArtwork } from "../src/MapArtwork";
import { CompassRose } from "../src/CompassRose";
import { launchBrowser } from "./browser";
const errors = validateCampus(campus);
if (errors.length) throw new Error(errors.join("\n"));
await mkdir("public/exports", { recursive: true });
const logo =
  "data:image/png;base64," +
  (await readFile("public/brand/logo-sman-1-gedeg.png")).toString("base64");
const svg = renderToStaticMarkup(
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1191"
    height="1684"
    viewBox="0 0 1191 1684"
    fontFamily="Arial, sans-serif"
  >
    <rect width="1191" height="1684" fill="#faf9f4" />
    <image href={logo} x="70" y="32" width="74" height="74" />
    <text x="164" y="77" fontSize="17" fill="#526650" letterSpacing="2">
      SPAB / SMAN 1 GEDEG
    </text>
    <text x="70" y="135" fontSize="40" fontWeight="700" fill="#183f35">
      Peta kesiapsiagaan sekolah
    </text>
    <text x="70" y="175" fontSize="18" fill="#526650">
      Denah induk · Jejak referensi untuk peninjauan
    </text>
    <rect x="70" y="203" width="1051" height="52" rx="3" fill="#f1e4cc" />
    <text x="90" y="235" fontSize="17" fontWeight="700" fill="#79521f">
      {campus.meta.warning}
    </text>
    <svg
      x="155"
      y="280"
      width="880"
      height="1120"
      viewBox={campus.meta.viewBox.join(" ")}
    >
      <MapArtwork />
    </svg>
    <rect x="1022" y="281" width="96" height="120" rx="4" fill="#fffefa" stroke="#c9d2c5" />
    <CompassRose x={1026} y={289} width={88} height={88} />
    <text x="1070" y="393" textAnchor="middle" fontSize="11" fontWeight="700" fill="#183f35">Arah perkiraan</text>
    <g fill="#294331" fontSize="16">
      <path d="M70 1430h35" stroke="#1b704c" strokeWidth="4" />
      <text x="118" y="1435">
        Jejak utama
      </text>
      <path
        d="M285 1430h35"
        stroke="#a36117"
        strokeWidth="4"
        strokeDasharray="8 5"
      />
      <text x="333" y="1435">
        Jejak alternatif
      </text>
      <text x="570" y="1435">
        KU · Lapangan utama
      </text>
      <text x="860" y="1435">
        K1 / K2 · Sementara
      </text>
      <text x="70" y="1480">
        KU: tujuan utama di luar gerbang. K1/K2: sementara saat akses
        padat/terhalang.
      </text>
      <text x="70" y="1510">
        Angin kencang: perlindungan dalam ruangan; ruang spesifik belum
        ditentukan.
      </text>
      <text x="70" y="1540">
        Pintu: lengkung = ayun; panah kanan–kiri = geser. Geometri tanpa skala
        ukur.
      </text>
    </g>
    <path d="M70 1580H1121" stroke="#c6cfc0" />
    <text x="70" y="1615" fontSize="14" fill="#526650">
      Sumber: denah lama dan konfirmasi pengguna · Penelusuran, bukan hasil
      survei
    </text>
    <text x="70" y="1640" fontSize="14" fill="#526650">
      Versi {campus.meta.version} · {campus.meta.date} · Rilis operasional
      ditahan
    </text>
  </svg>,
);
await writeFile("public/exports/peta.svg", svg);
const browser = await launchBrowser();
try {
  const page = await browser.newPage({
    viewport: { width: 1191, height: 1684 },
    deviceScaleFactor: 2,
  });
  await page.setContent(
    `<html><head><style>body{margin:0}svg{display:block;width:100%;height:100%}@media print{html,body{height:100%;width:100%}svg{height:100%;width:100%;max-height:100%}}</style></head><body>${svg}</body></html>`,
  );
  await page.screenshot({ path: "public/exports/peta.png", fullPage: true });
  for (const format of ["A3", "A4"] as const) {
    await page.pdf({
      path: `public/exports/peta-${format.toLowerCase()}.pdf`,
      format,
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });
  }
  for (const floor of [1, 2]) {
    const doors = campus.access.doors.filter(
      (d) => d.localPosition && d.floor === floor,
    );
    const detail = renderToStaticMarkup(
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1191"
        height="1684"
        viewBox="0 0 1191 1684"
        fontFamily="Arial, sans-serif"
      >
        <rect width="1191" height="1684" fill="#faf9f4" />
        <image href={logo} x="65" y="35" width="80" height="80" />
        <g fill="#183f35">
          <text x="170" y="85" fontSize="30" fontWeight="700">
            SMAN 1 Gedeg · G–H lantai {floor}
          </text>
          <text x="65" y="160" fontSize="17">
            {campus.meta.warning}
          </text>
          <svg x="60" y="220" width="1070" height="400" viewBox="0 15 460 145">
            <FloorArtwork floor={floor} />
          </svg>
          <text x="65" y="670" fontSize="20" fontWeight="700">
            Bukaan pintu — satu ID untuk satu bukaan
          </text>
          {doors.map((d, i) => (
            <text key={d.id} x="65" y={720 + i * 48} fontSize="20">
              {d.id} · {doorDescription(d)}
              {d.marker ? "" : " · posisi dari keterangan pengguna"}
            </text>
          ))}
          <text x="65" y="1100" fontSize="19">
            Merah: batas ruang. Hijau: koridor. Tangga: kiri G dan kanan H.
          </text>
          <text x="65" y="1140" fontSize="19">
            Arah bukaan pintu tidak menentukan arah perjalanan.
          </text>
          <text x="65" y="1180" fontSize="19">
            Ukuran, tinggi, serta bentuk konstruksi tangga belum diukur.
          </text>
          <text x="65" y="1220" fontSize="19">
            Sambungan ruang yang belum jelas belum dijadikan rute.
          </text>
          <text x="65" y="1530" fontSize="18">
            Sumber: gambar lantai dan konfirmasi pengguna. Status: draf untuk
            ditinjau.
          </text>
          <text x="65" y="1570" fontSize="18">
            Versi {campus.meta.version} · {campus.meta.date}
          </text>
        </g>
      </svg>,
    );
    const name = `gh-lantai-${floor}`;
    await writeFile(`public/exports/${name}.svg`, detail);
    await page.setContent(
      `<html><style>html,body{margin:0;width:100%;height:100%}svg{display:block;width:100%;height:100%}</style><body>${detail}</body></html>`,
    );
    await page.screenshot({
      path: `public/exports/${name}.png`,
      fullPage: true,
    });
    await page.pdf({
      path: `public/exports/${name}.pdf`,
      format: "A4",
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });
  }
} finally {
  await browser.close();
}
const rows = [
  "jenis,id,kode_atau_nama,pertanyaan,status,peran_peninjau,tanggal,bukti",
  ...campus.access.doors.map(
    (d) =>
      `pintu,${d.id},"${doorDescription(d)}","Posisi; ruang; sambungan koridor; ${d.note}",konfirmasi_pengguna,,,`,
  ),
  ...campus.buildings.map(
    (b) =>
      `gedung,${b.id},${b.code},"Nama; letak pintu; koridor; lantai; ramp dan tangga",belum,,,`,
  ),
  ...campus.destinations.map(
    (d) =>
      `tujuan,${d.id},"${d.name}","Skenario berlaku; kapasitas; bahaya sekitar",belum,,,`,
  ),
  ...campus.referenceTraces.map(
    (t) =>
      `jejak,${t.id},"${t.name}","Asal dan tujuan; akses; pencocokan lima jalur dalam dokumen",belum,,,`,
  ),
  ...campus.scenarios
    .filter((s) => s.id !== "reference")
    .map(
      (s) =>
        `sop,${s.id},${s.name},"Prosedur; waktu tindakan; rute dan tujuan",belum,,,`,
    ),
];
await writeFile(
  "public/exports/lembar-verifikasi.csv",
  "\uFEFF" +
    rows
      .map(
        (r, i) =>
          r +
          (i === 0 ? ",versi,status_paket" : `,${campus.meta.version},DRAF`),
      )
      .join("\n") +
    "\n",
);
console.log(
  "SVG, PNG, PDF A3/A4, dan lembar verifikasi dibuat di " +
    resolve("public/exports"),
);
