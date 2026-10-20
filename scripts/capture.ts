import { launchBrowser } from "./browser";
const browser = await launchBrowser();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
});
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5173");
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
await page.getByRole("button", { name: "Gedung B", exact: true }).click();
await page.getByRole("button", { name: "Model 3D", exact: true }).click();
await page.waitForTimeout(1800);
await page.screenshot({ path: "artifacts/3d.png", fullPage: true });
await page.setViewportSize({ width: 360, height: 900 });
await page.getByRole("button", { name: "Denah 2D", exact: true }).click();
await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
console.log({ errors });
await browser.close();
