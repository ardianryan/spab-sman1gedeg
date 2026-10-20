import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ffmpeg from "ffmpeg-static";
import { launchBrowser } from "./browser";
import { chapters } from "../src/VideoScene";
import { campus, validateCampus } from "../src/model";
const errors = validateCampus(campus);
if (errors.length) throw new Error(errors.join("\n"));
const origin = process.env.PREVIEW_URL ?? "http://127.0.0.1:5173";
await mkdir("artifacts/frames", { recursive: true });
await mkdir("public/exports", { recursive: true });
const browser = await launchBrowser();
const renderLog: {
  file: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  chapters: number[];
  version: string;
}[] = [];
const run = (args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const p = spawn(ffmpeg!, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d));
    p.on("error", reject);
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(stderr)),
    );
  });
function srtTime(seconds: number) {
  return `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")},000`;
}
try {
  for (const format of [
    {
      name: "utama",
      width: 1920,
      height: 1080,
      sequence: [0, 1, 2, 3, 4, 5, 6, 7],
      duration: 15,
    },
    {
      name: "vertikal",
      width: 1080,
      height: 1920,
      sequence: [2, 3, 5, 6, 7],
      duration: 10,
    },
  ]) {
    const page = await browser.newPage({
      viewport: { width: format.width, height: format.height },
      deviceScaleFactor: 1,
    });
    await page.goto(
      `${origin}/?video=${format.name === "utama" ? "landscape" : "vertical"}`,
    );
    await page.waitForFunction(() => window.videoReady);
    await page.evaluate(() => document.fonts.ready);
    const segments: string[] = [];
    for (const [index, chapter] of format.sequence.entries()) {
      const loop = chapters[chapter].traces;
      const frames = loop ? 150 : 1;
      const output = resolve(`artifacts/frames/${format.name}-${index}.mp4`);
      segments.push(output);
      const encoder = spawn(
        ffmpeg!,
        [
          "-y",
          "-loglevel",
          "error",
          "-f",
          "image2pipe",
          "-framerate",
          "30",
          "-vcodec",
          "mjpeg",
          "-i",
          "pipe:0",
          "-an",
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-crf",
          "21",
          "-pix_fmt",
          "yuv420p",
          output,
        ],
        { stdio: ["pipe", "ignore", "pipe"] },
      );
      let stderr = "";
      encoder.stderr.on("data", (d) => (stderr += d));
      const closed = once(encoder, "close");
      for (let i = 0; i < frames; i++) {
        await page.evaluate(
          ({ chapter, progress }) => window.setVideoFrame?.(chapter, progress),
          { chapter, progress: loop ? (i / frames) * 5 : 0 },
        );
        await page.evaluate(
          () =>
            new Promise<void>((r) =>
              requestAnimationFrame(() => requestAnimationFrame(() => r())),
            ),
        );
        const buffer = await page.screenshot({ type: "jpeg", quality: 90 });
        if (!encoder.stdin.write(buffer)) await once(encoder.stdin, "drain");
      }
      encoder.stdin.end();
      const [code] = await closed;
      if (code !== 0) throw new Error(stderr);
      const padded = resolve(
        `artifacts/frames/${format.name}-${index}-full.mp4`,
      );
      await run([
        "-y",
        "-loglevel",
        "error",
        "-stream_loop",
        "-1",
        "-i",
        output,
        "-t",
        String(format.duration),
        "-an",
        "-c:v",
        "copy",
        padded,
      ]);
      segments[index] = padded;
      console.log(
        `Video ${format.name}: adegan ${index + 1}/${format.sequence.length} selesai.`,
      );
    }
    const concat = resolve(`artifacts/frames/${format.name}.txt`);
    await writeFile(
      concat,
      segments.map((s) => `file '${s.replace(/'/g, "'\\''")}'`).join("\n"),
    );
    const file = `sosialisasi-${format.name}.mp4`;
    await run([
      "-y",
      "-loglevel",
      "error",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concat,
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "20",
      "-threads",
      "4",
      "-movflags",
      "+faststart",
      resolve("public/exports", file),
    ]);
    await writeFile(
      `public/exports/sosialisasi-${format.name}.srt`,
      format.sequence
        .map(
          (ch, i) =>
            `${i + 1}\n${srtTime(i * format.duration)} --> ${srtTime((i + 1) * format.duration)}\n${i === 0 ? `DRAF · ${campus.meta.version}\n` : ""}${chapters[ch].title}\n${chapters[ch].text}\n`,
        )
        .join("\n"),
    );
    renderLog.push({
      file,
      width: format.width,
      height: format.height,
      fps: 30,
      duration: format.sequence.length * format.duration,
      chapters: format.sequence,
      version: campus.meta.version,
    });
    await page.close();
  }
  await writeFile(
    "public/exports/naskah-video.txt",
    `${campus.meta.warning}\n${campus.meta.school} · ${campus.meta.version}\nTanpa narasi suara. Naskah berikut disediakan untuk peninjauan dan rekaman kemudian.\n\n` +
      chapters.map((c, i) => `${i + 1}. ${c.title}\n${c.text}`).join("\n\n"),
  );
  await writeFile(
    "artifacts/video-render.json",
    JSON.stringify(renderLog, null, 2),
  );
  console.log("Dua video dan takarir selesai.");
} finally {
  await browser.close();
}
