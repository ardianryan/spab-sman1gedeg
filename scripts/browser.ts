import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
export const chromePath =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const launchBrowser = () =>
  chromium.launch({
    headless: true,
    ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
    args: ["--allow-file-access-from-files"],
  });
