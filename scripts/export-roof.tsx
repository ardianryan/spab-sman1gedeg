import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile, writeFile } from "node:fs/promises";
import { RoofArtwork, roofPlan, roofViewBox, type RoofBase } from "../src/RoofPlan";
import { registrationFit, project, type XY } from "../src/registration";
import { launchBrowser } from "./browser";

const browser = await launchBrowser();
try {
  for (const base of ["clean", "satellite"] as RoofBase[]) {
    const name = base === "clean" ? "denah-atap" : "denah-atap-satelit";
    let svg = renderToStaticMarkup(<svg xmlns="http://www.w3.org/2000/svg" width="1191" height="1684" viewBox="0 0 1191 1684" fontFamily="Arial, sans-serif">
      <rect width="1191" height="1684" fill="#faf9f5" />
      <image href="./brand/logo-sman-1-gedeg.png" x="55" y="35" width="74" height="74" />
      <g fill="#183f35">
        <text x="150" y="65" fontSize="30" fontWeight="700">Denah hasil penelusuran atap</text>
        <text x="150" y="96" fontSize="20">SMA Negeri 1 Gedeg · {base === "clean" ? "draf denah baru" : "pencocokan citra satelit"}</text>
        <text x="55" y="145" fontSize="20" fontWeight="700">DRAF — BELUM DIVERIFIKASI UNTUK PENGGUNAAN OPERASIONAL</text>
      </g>
      <svg x="55" y="175" width="1081" height="1310" viewBox={roofViewBox(base).join(" ")}>
        <RoofArtwork base={base} opacity={.65} />
      </svg>
      <g fill="#183f35" fontSize="17">
        <text x="55" y="1520">Terakota: kode sementara · Abu-abu: kode belum diketahui · Hijau: lapangan/taman</text>
        <text x="55" y="1550">Batas atap bukan batas dinding. Pintu dan jalur belum dipindahkan ke denah baru.</text>
        <text x="55" y="1580">Asal gambar udara belum terverifikasi. Citra pembanding: Google Maps dari pengguna.</text>
        <text x="55" y="1610">R16–R21 adalah ID penelusuran. A1 belum teridentifikasi pasti. Tanpa skala ukur.</text>
        <text x="55" y="1640">Versi atap {roofPlan.version} · {roofPlan.date} · Penelusuran manual, bukan survei</text>
      </g>
    </svg>);
    for (const path of ["./brand/logo-sman-1-gedeg.png", "./reference/google-maps-satelit.png"]) {
      if (svg.includes(path)) svg = svg.replaceAll(path, "data:image/png;base64," + (await readFile("public/" + path.slice(2))).toString("base64"));
    }
    await writeFile(`public/exports/${name}.svg`, svg);
    const page = await browser.newPage({ viewport: { width: 1191, height: 1684 }, deviceScaleFactor: 1 });
    await page.setContent(`<html><style>html,body{margin:0}svg{display:block;width:100%;height:auto}</style><body>${svg}</body></html>`);
    await page.screenshot({ path: `public/exports/${name}.png`, fullPage: true });
    await page.pdf({ path: `public/exports/${name}.pdf`, format: "A3", printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
    await page.close();
  }
} finally { await browser.close(); }
const fit = registrationFit("aerial");
await writeFile("public/exports/denah-atap-data.json", JSON.stringify({
  ...roofPlan,
  imageRegistration: { ...fit, target: "Piksel citra satelit, bukan koordinat GPS", independentlyValidated: false },
  satelliteRoofs: roofPlan.roofs.map((r) => ({ id: r.id, polygon: r.polygon.map((p) => project(p as XY, fit.matrix)) })),
}, null, 2) + "\n");
console.log("Denah atap bersih dan satelit diekspor ke SVG, PNG, PDF, serta JSON.");
