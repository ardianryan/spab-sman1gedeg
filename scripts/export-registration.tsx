import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile, writeFile } from "node:fs/promises";
import { RegistrationArtwork } from "../src/RegistrationPanel";
import { registration, registrationFit } from "../src/registration";
import { campus } from "../src/model";
import { launchBrowser } from "./browser";
import { geographicPreview } from "../src/geo";
const fit = registrationFit("campus");
let svg = renderToStaticMarkup(
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1191"
    height="1684"
    viewBox="0 0 1191 1684"
    fontFamily="Arial, sans-serif"
  >
    <rect width="1191" height="1684" fill="#faf9f4" />
    <image
      href="./brand/logo-sman-1-gedeg.png"
      x="65"
      y="35"
      width="75"
      height="75"
    />
    <g fill="#183f35">
      <text x="165" y="80" fontSize="28" fontWeight="700">
        SMAN 1 Gedeg · Prapemetaan citra
      </text>
      <text x="65" y="145" fontSize="17">
        {campus.meta.warning}
      </text>
      <svg x="220" y="185" width="750" height="910" viewBox="0 0 669 812">
        <RegistrationArtwork opacity={0.85} />
      </svg>
      <text x="65" y="1145" fontSize="22">
        Acuan: tengah lapangan upacara · -7.454896, 112.398510
      </text>
      <text x="65" y="1180" fontSize="19">
        Enam titik manual · transformasi afin · selisih RMS{" "}
        {fit.rmse.toFixed(1)} piksel
      </text>
      {registration.controlPoints.map((p, i) => (
        <text key={p.id} x="65" y={1225 + i * 34} fontSize="18">
          {p.id} · {p.feature} · {fit.residuals[i].toFixed(1)} px
        </text>
      ))}
      <text x="65" y="1470" fontSize="17">
        Selisih piksel bukan akurasi meter. Skala dan orientasi geografis belum
        dikalibrasi.
      </text>
      <text x="65" y="1500" fontSize="17">
        Pintu ditandai secara visual tanpa koordinat geografis. Denah belum
        disahkan.
      </text>
      <text x="65" y="1530" fontSize="17">
        Google Maps: tangkapan layar pengguna; tanggal citra tidak diketahui.
      </text>
      <text x="65" y="1590" fontSize="17">
        Versi {campus.meta.version} · {registration.date} · Draf pencocokan,
        bukan survei
      </text>
    </g>
  </svg>,
);
for (const name of [
  "./brand/logo-sman-1-gedeg.png",
  registration.satellite.path,
])
  svg = svg.replaceAll(
    name,
    "data:image/png;base64," +
      (await readFile("public/" + name.slice(2))).toString("base64"),
  );
await writeFile("public/exports/prapemetaan.svg", svg);
const browser = await launchBrowser();
try {
  const page = await browser.newPage({
    viewport: { width: 1191, height: 1684 },
  });
  await page.setContent(
    `<html><style>html,body{margin:0;width:100%;height:100%}svg{display:block;width:100%;height:100%}</style><body>${svg}</body></html>`,
  );
  await page.screenshot({
    path: "public/exports/prapemetaan.png",
    fullPage: true,
  });
  await page.pdf({
    path: "public/exports/prapemetaan.pdf",
    format: "A4",
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });
} finally {
  await browser.close();
}
await writeFile(
  "public/exports/prapemetaan-data.json",
  JSON.stringify(
    {
      ...registration,
      geographicPreview: {
        ...geographicPreview(),
        status: "provisional-not-for-gps",
        independentlyValidated: false,
      },
      fits: {
        campus: registrationFit("campus"),
        aerial: registrationFit("aerial"),
      },
    },
    null,
    2,
  ),
);
console.log("Prapemetaan SVG/PNG/PDF dan data transformasi selesai.");
