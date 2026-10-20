import { campus, validateCampus } from "../src/model";
const errors = validateCampus(campus, process.argv.includes("--operational"));
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Data ${campus.meta.version}: ${campus.buildings.length} gedung, ${campus.referenceTraces.length} potongan jejak, ${campus.routes.length} rute operasional. Validasi draf lulus.`,
  );
