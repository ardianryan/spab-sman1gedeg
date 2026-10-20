import { execFileSync } from "node:child_process";
import { readFile, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import ffmpeg from "ffmpeg-static";
import ffprobe from "ffprobe-static";
import { campus } from "../src/model";
const results: Record<string, unknown>[] = [];
for (const [name, width, height, duration] of [
  ["utama", 1920, 1080, 120],
  ["vertikal", 1080, 1920, 50],
] as const) {
  const file = `public/exports/sosialisasi-${name}.mp4`;
  const probe = JSON.parse(
    execFileSync(
      ffprobe.path,
      [
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_streams",
        "-show_format",
        file,
      ],
      { encoding: "utf8" },
    ),
  );
  const video = probe.streams.find(
    (s: { codec_type: string }) => s.codec_type === "video",
  );
  if (
    video.width !== width ||
    video.height !== height ||
    video.r_frame_rate !== "30/1" ||
    Math.abs(Number(probe.format.duration) - duration) > 0.15
  )
    throw new Error(`Format video tidak sesuai: ${name}`);
  execFileSync(ffmpeg!, ["-v", "error", "-i", file, "-f", "null", "-"], {
    stdio: "pipe",
  });
  results.push({
    file,
    width,
    height,
    duration: probe.format.duration,
    fps: video.r_frame_rate,
    decode: "passed",
  });
}
for (const file of [
  "gh-lantai-1.pdf",
  "gh-lantai-2.pdf",
  "gh-lantai-1.svg",
  "gh-lantai-2.svg",
  "gh-lantai-1.png",
  "gh-lantai-2.png",
  "prapemetaan.pdf",
  "prapemetaan.svg",
  "prapemetaan.png",
  "prapemetaan-data.json",
  "peta.svg",
  "peta.png",
  "peta-a3.pdf",
  "peta-a4.pdf",
  "sosialisasi-utama.mp4",
  "sosialisasi-vertikal.mp4",
  "sosialisasi-utama.srt",
  "sosialisasi-vertikal.srt",
  "naskah-video.txt",
  "lembar-verifikasi.csv",
]) {
  const path = `public/exports/${file}`,
    buf = await readFile(path);
  if ((await stat(path)).size < 20) throw new Error(`Berkas kosong: ${file}`);
  results.push({
    file,
    bytes: buf.length,
    sha256: createHash("sha256").update(buf).digest("hex"),
  });
}
await writeFile(
  "artifacts/export-report.json",
  JSON.stringify(
    {
      version: campus.meta.version,
      status: "draft",
      checkedAt: new Date().toISOString(),
      results,
    },
    null,
    2,
  ),
);
console.log(
  "Kedua video lolos pemeriksaan ukuran, durasi, fps, dan dekode penuh. Manifest ekspor dibuat.",
);
