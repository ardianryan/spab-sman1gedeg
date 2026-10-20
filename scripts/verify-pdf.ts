import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const report = [];
for (const [name, w, h] of [
  ["a3", 841.89, 1190.55],
  ["a4", 595.28, 841.89],
] as const) {
  const task = getDocument({
    data: new Uint8Array(await readFile(`public/exports/peta-${name}.pdf`)),
    useSystemFonts: true,
  });
  const doc = await task.promise;
  if (doc.numPages !== 1) throw new Error(`${name}: PDF harus satu halaman`);
  const page = await doc.getPage(1),
    view = page.getViewport({ scale: 1 });
  if (Math.abs(view.width - w) > 2 || Math.abs(view.height - h) > 2)
    throw new Error(`${name}: ukuran kertas salah`);
  const content = await page.getTextContent(),
    text = content.items
      .filter((i) => "str" in i)
      .map((i) => (i as { str: string }).str)
      .join(" ");
  for (const required of [
    "DRAF",
    "BELUM DIVERIFIKASI",
    "Peta kesiapsiagaan",
    "KU",
    "K1",
    "K2",
    "0.2.0-draft",
  ])
    if (!text.includes(required))
      throw new Error(`${name}: teks hilang: ${required}`);
  const ops = await page.getOperatorList();
  const paths = ops.fnArray.filter((op) => op === OPS.constructPath).length;
  if (paths < 30) throw new Error(`${name}: tidak cukup jalur vektor`);
  report.push({
    file: `peta-${name}.pdf`,
    pages: doc.numPages,
    width: view.width,
    height: view.height,
    vectorPaths: paths,
    requiredText: "passed",
  });
  await task.destroy();
}
await mkdir("artifacts", { recursive: true });
await writeFile("artifacts/pdf-report.json", JSON.stringify(report, null, 2));
console.log(report);
