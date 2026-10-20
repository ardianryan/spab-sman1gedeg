import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import { readFile, writeFile } from "node:fs/promises";
import { campus } from "../src/model";
const results = [];
for (const name of ["gh-lantai-1", "gh-lantai-2", "prapemetaan"]) {
  const task = getDocument({
    data: new Uint8Array(await readFile(`public/exports/${name}.pdf`)),
    useSystemFonts: true,
  });
  const doc = await task.promise;
  if (doc.numPages !== 1) throw new Error(`${name}: jumlah halaman`);
  const page = await doc.getPage(1),
    v = page.getViewport({ scale: 1 }),
    content = await page.getTextContent();
  const text = content.items
    .filter((x) => "str" in x)
    .map((x) => (x as { str: string }).str)
    .join(" ");
  const required = [
    "DRAF",
    "BELUM DIVERIFIKASI",
    campus.meta.version,
    ...(name.startsWith("gh")
      ? campus.access.doors
          .filter((d) => d.localPosition && d.floor === Number(name.at(-1)))
          .map((d) => d.id)
      : ["-7.454896", "112.398510", "CP1", "CP6"]),
  ];
  for (const s of required)
    if (!text.includes(s)) throw new Error(`${name}: teks ${s} hilang`);
  if (Math.abs(v.width - 595.28) > 2 || Math.abs(v.height - 841.89) > 2)
    throw new Error(`${name}: ukuran A4`);
  const operators = await page.getOperatorList();
  results.push({
    name,
    pages: 1,
    requiredText: "passed",
    vectorPaths: operators.fnArray.filter((n) => n === OPS.constructPath)
      .length,
  });
  await task.destroy();
}
await writeFile(
  "artifacts/detail-pdf-report.json",
  JSON.stringify(results, null, 2),
);
console.log(results);
