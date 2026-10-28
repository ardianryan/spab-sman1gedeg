import { test, expect } from "@playwright/test";
test("pratinjau geografis menampilkan sudut perkiraan tanpa mengaktifkan GPS", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Prapemetaan citra", exact: true }).click();
  await expect(page.getByText("5 koordinat telah diterima.", { exact: false })).toBeVisible();
  await page.getByLabel("Tampilkan proyeksi sudut yang belum pasti").check();
  await expect(page.locator('.registration-map circle[stroke-dasharray="3 2"]')).toHaveCount(2);
  await page.getByLabel("Tampilkan proyeksi sudut yang belum pasti").uncheck();
  await expect(page.locator('.registration-map circle[stroke-dasharray="3 2"]')).toHaveCount(0);
});
for (const width of [360, 768, 1440])
  test(`peta dan kontrol pada lebar ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Peta kesiapsiagaan", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Gedung B", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Gedung B", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Rute belum tersedia", { exact: true }),
    ).toBeVisible();
    await page.getByLabel("Cari kode gedung").fill("ZZ");
    await expect(
      page.getByText("Kode tidak ditemukan.", { exact: false }),
    ).toBeVisible();
    await page.getByLabel("Cari kode gedung").fill("");
    await page.getByLabel("Konteks peninjauan").selectOption("wind");
    await expect(page.locator("[data-trace]")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "▷ Putar animasi" }),
    ).toBeDisabled();
    await page.getByLabel("Konteks peninjauan").selectOption("reference");
    await expect(page.locator("[data-trace]")).toHaveCount(7);
    await page.getByRole("button", { name: "Unduh media" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("link", { name: "Peta A4" })).toHaveAttribute(
      "href",
      "./exports/peta-a4.pdf",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
test("animasi bergerak, jeda berhenti, ulangi mereset", async ({ page }) => {
  await page.goto("/");
  const arrow = page.locator('[data-trace="T1"] path').first();
  const before = await arrow.getAttribute("transform");
  await page.getByRole("button", { name: "▷ Putar animasi" }).click();
  await expect(arrow).not.toHaveAttribute("transform", before!);
  await page.getByRole("button", { name: "Ⅱ Jeda animasi" }).click();
  await page.waitForTimeout(100);
  const paused = await arrow.getAttribute("transform");
  await page.waitForTimeout(250);
  expect(await arrow.getAttribute("transform")).toBe(paused);
  await page.getByRole("button", { name: "Ulangi", exact: true }).click();
  await expect(arrow).toHaveAttribute("transform", before!);
});
test("reduced motion dan keyboard dapat memilih gedung", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "▷ Putar animasi" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Pilih gedung C", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Gedung C", exact: true }),
  ).toBeVisible();
});
test("lapisan fasilitas tidak mengarang posisi; dialog mengembalikan fokus", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Fasilitas keselamatan").check();
  await expect(
    page.getByText("Posisi belum diketahui;", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sumber & verifikasi" }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Sumber & verifikasi" }),
  ).toBeFocused();
});
test("zoom, geser, reset, lapisan dan filter bekerja", async ({ page }) => {
  await page.goto("/");
  const svg = page.locator(".campus-map"),
    initial = await svg.getAttribute("viewBox");
  await page
    .getByRole("button", { name: "Perbesar peta", exact: true })
    .click();
  await expect(svg).not.toHaveAttribute("viewBox", initial!);
  await page
    .getByRole("button", { name: "Geser peta ke kiri", exact: true })
    .click();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(svg).toHaveAttribute("viewBox", initial!);
  await page.getByLabel("Jenis jejak").selectOption("alternatif");
  await expect(page.locator("[data-trace]")).toHaveCount(4);
  await page.getByLabel("Jejak referensi", { exact: true }).uncheck();
  await expect(page.locator("[data-trace]")).toHaveCount(0);
});
test("foto lokal dan GPS tidak menampilkan posisi palsu sebelum kalibrasi", async ({ page, context }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: -7.454896, longitude: 112.398510, accuracy: 12 });
  await page.goto("/");
  await page.getByRole("button", { name: "Peta lokasi", exact: true }).click();
  await expect(page.locator('.campus-map image[href="./reference/udara-referensi.png"]')).toHaveCount(1);
  await page.getByRole("button", { name: "◎ Kamu sedang di sini" }).click();
  await expect(page.getByText("akurasi GPS ±12 m.", { exact: false })).toBeVisible();
  await expect(page.getByText("Penanda belum bisa ditempatkan pada denah.", { exact: false })).toBeVisible();
  await expect(page.locator(".leaflet-interactive.leaflet-clickable")).toHaveCount(0);
  await page.getByRole("button", { name: "Denah", exact: true }).click();
  await expect(page.locator('.campus-map image[href="./reference/udara-referensi.png"]')).toHaveCount(0);
  expect(requests.some((url) => url.includes("google.com/vt") || url.includes("tile.openstreetmap.org"))).toBe(false);
});
test("empat arah mata angin terlihat pada denah dan peta lokasi", async ({ page }) => {
  await page.goto("/");
  const compass = page.getByRole("img", { name: "Arah mata angin perkiraan: utara, timur, selatan, barat" });
  await expect(compass).toBeVisible();
  await expect(compass.locator("text")).toHaveText(["U", "T", "S", "B"]);
  await page.getByRole("button", { name: "Peta lokasi", exact: true }).click();
  await expect(compass).toBeVisible();
  await expect(compass.locator("text")).toHaveText(["U", "T", "S", "B"]);
});
test("peta lokasi menampilkan penanda dan lingkaran setelah kalibrasi; pilihan gedung tersinkron", async ({ page, context }) => {
  const offsets: [number, number][] = [[30, 0], [0, 35], [35, 30]];
  const points = offsets.map(([east, north], i) => {
    const latitude = -7.454896 + north / 110574;
    const longitude = 112.398510 + east / (111320 * Math.cos(-7.454896 * Math.PI / 180));
    return { id: `test-${i}`, label: `Titik ${i}`, latitude, longitude, campus: [614 + 2 * east, 625 - 2 * north] };
  });
  await page.addInitScript((saved) => localStorage.setItem("spab-gedeg-geocalibration-v1", JSON.stringify(saved)), points);
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: -7.454896, longitude: 112.398510, accuracy: 8 });
  await page.goto("/");
  await page.getByRole("button", { name: "Peta lokasi", exact: true }).click();
  await page.getByRole("button", { name: "◎ Kamu sedang di sini" }).click();
  await expect(page.getByText("akurasi GPS ±8 m.", { exact: false })).toBeVisible();
  await expect(page.locator('.leaflet-overlay-pane path[fill="#006b96"]')).toHaveCount(1);
  await expect(page.locator('.leaflet-overlay-pane path[stroke="#075a83"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Gedung B", exact: true }).click();
  await page.getByRole("button", { name: "Denah 2D", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Gedung B", exact: true })).toBeVisible();
});
test("penolakan GPS tidak menghalangi pilihan gedung manual", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "geolocation", { value: {
    watchPosition(_success: unknown, error: (reason: { code: number }) => void) { queueMicrotask(() => error({ code: 1 })); return 1; },
    clearWatch() {},
  } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Peta lokasi", exact: true }).click();
  await page.getByRole("button", { name: "◎ Kamu sedang di sini" }).click();
  await expect(page.getByText("Izin lokasi ditolak.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Gedung A", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Gedung A", exact: true })).toBeVisible();
});
test("peta lokasi tetap dapat dipakai di ponsel dan memenuhi pemeriksaan aksesibilitas", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Peta lokasi", exact: true }).click();
  await expect(page.locator(".leaflet-campus")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(result.violations).toEqual([]);
});
test("3D mempertahankan gedung terpilih atau menyediakan fallback", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Gedung B", exact: true }).click();
  await page.getByRole("button", { name: "Model 3D", exact: true }).click();
  await expect(
    page
      .locator(".three-host canvas")
      .or(page.getByRole("button", { name: "Kembali ke peta 2D" })),
  ).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByRole("heading", { name: "Gedung B", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Denah 2D", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pilih gedung B", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("kegagalan WebGL tidak merusak aplikasi", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null;
      return (original as Function).call(this, type, ...args);
    } as typeof original;
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Model 3D", exact: true }).click();
  await page.getByRole("button", { name: "Kembali ke peta 2D" }).click();
  await expect(page.locator(".campus-map")).toBeVisible();
});
test("aksesibilitas otomatis pada halaman utama", async ({ page }) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  await page.goto("/");
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
test("logo sekolah asli digunakan dan dapat dimuat", async ({ page }) => {
  await page.goto("/");
  const logo = page.getByRole("img", { name: "Logo SMA Negeri 1 Gedeg" });
  await expect(logo).toHaveAttribute("src", "./brand/logo-sman-1-gedeg.png");
  expect(
    await logo.evaluate(
      (el: HTMLImageElement) => el.complete && el.naturalWidth === 634,
    ),
  ).toBe(true);
});

test("pintu O dan M, pilihan lantai G–H, serta tujuan bersyarat", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Gedung O", exact: true }).click();
  await expect(page.locator(".door-list")).toContainText("geser kanan–kiri");
  await expect(page.locator(".door-list")).toContainText("Bangunan terpisah O");
  await page.getByRole("button", { name: "Gedung M", exact: true }).click();
  await expect(page.locator(".door-list button").first()).toContainText(
    "1 daun",
  );
  await page.getByRole("button", { name: "Gedung G", exact: true }).click();
  await page.getByRole("button", { name: "Lantai 2", exact: true }).click();
  await expect(page.locator(".floor-panel")).toContainText("G2-D01");
  await page.locator(".door-list button").first().click();
  await expect(page.locator(".door-list button").first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Model 3D", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Lantai 2", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Denah 2D", exact: true }).click();
  await page
    .getByLabel("Kondisi simulasi", { exact: true })
    .selectOption("blocked");
  await expect(
    page.locator(".campus-map text").filter({ hasText: /^KU$/ }),
  ).toHaveCount(1);
  await expect(page.locator('[data-destination="KU"]')).toHaveAttribute(
    "data-active",
    "false",
  );
  await expect(
    page.locator(".campus-map text").filter({ hasText: /^K1$/ }),
  ).toHaveCount(1);
  await page.getByLabel("Konteks peninjauan").selectOption("wind");
  await expect(
    page.locator(".campus-map text").filter({ hasText: /^K[12U]$/ }),
  ).toHaveCount(0);
});

test("prapemetaan menampilkan acuan lapangan dan lapisan dapat dibandingkan", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Prapemetaan citra", exact: true })
    .click();
  await expect(page.locator(".registration-panel")).toContainText(
    "-7.454896, 112.398510",
  );
  await page.getByLabel("Lapisan pembanding").selectOption("aerial");
  await expect(page.locator(".registration-map image")).toHaveCount(2);
  await page.getByLabel("Ketampakan lapisan").fill("0.25");
  await expect(page.locator(".registration-map image").nth(1)).toHaveAttribute(
    "opacity",
    "0.25",
  );
  await page.setViewportSize({ width: 360, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Denah 2D", exact: true }).click();
  for (const id of ["A", "B", "C", "G", "H", "M", "O"])
    await expect(page.locator(`[data-building-label="${id}"] text`)).toHaveText(
      id,
    );
});

test("K1 K2 tetap terlihat saat normal dan taman memiliki lapisan tersendiri", async ({
  page,
}) => {
  await page.goto("/");
  for (const id of ["KU", "K1", "K2"])
    await expect(page.locator(`[data-destination="${id}"]`)).toBeVisible();
  await expect(page.locator('[data-destination="K1"]')).toHaveAttribute(
    "data-active",
    "false",
  );
  await expect(page.locator("[data-obstacle]")).toHaveCount(2);
  await page.getByLabel("Taman / penghalang", { exact: true }).uncheck();
  await expect(page.locator("[data-obstacle]")).toHaveCount(0);
});

for (const width of [360, 1440]) test(`draf atap dapat dibandingkan dan dipilih pada lebar ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Prapemetaan citra", exact: true }).click();
  await page.getByRole("button", { name: "Draf denah atap", exact: true }).click();
  await expect(page.locator("[data-roof]")).toHaveCount(21);
  await page.getByLabel("Pilih atap untuk ditinjau").selectOption("R06");
  await expect(page.getByRole("button", { name: "Atap G", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Latar pembanding").selectOption("satellite");
  await expect(page.locator(".roof-map image")).toHaveAttribute("href", "./reference/google-maps-satelit.png");
  await page.getByLabel("Bandingkan batas denah lama").check();
  await expect(page.locator("[data-old-roofs] polygon")).toHaveCount(16);
  await page.getByRole("button", { name: "Perbesar atap", exact: true }).click();
  await expect(page.locator(".roof-toolbar")).toContainText("150%");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Reset atap", exact: true }).click();
  await page.getByLabel("Latar pembanding").selectOption("aerial");
  await expect(page.locator(".roof-map image")).toHaveAttribute("href", "./reference/udara-referensi.png");
  await page.screenshot({ path: `artifacts/roof-${width}.png`, fullPage: true });
});
