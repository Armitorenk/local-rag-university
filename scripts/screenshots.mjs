/**
 * Regenerate the screenshots in screenshots/ from the live app.
 * Requires the server running (npm start) at http://127.0.0.1:3000 and a
 * local Chrome or Edge install. Run with: npm run screenshots
 */
import puppeteer from "puppeteer-core";
import { existsSync } from "fs";
import path from "path";

const BASE = "http://127.0.0.1:3000";
const OUT = path.resolve(process.cwd(), "screenshots");

const BROWSERS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const executablePath = BROWSERS.find(existsSync);
if (!executablePath) {
  console.error("No Chrome/Edge found.");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars", "--force-color-profile=srgb"],
});
const page = await browser.newPage();

async function waitReady() {
  await page.goto(BASE, { waitUntil: "networkidle2" });
  await page.waitForFunction(
    () => document.querySelector("#status")?.classList.contains("ready"),
    { timeout: 90000 }
  );
  await sleep(300);
}

async function ask(q) {
  await page.click("#input");
  await page.type("#input", q);
  await page.keyboard.press("Enter");
  // The Copy/Regenerate action bar is appended only after streaming completes.
  await page.waitForFunction(
    () => [...document.querySelectorAll(".row")].some((r) => r.querySelector(".msg-actions")),
    { timeout: 120000 }
  );
  await sleep(500);
}

async function shot(name) {
  await page.screenshot({ path: path.join(OUT, name) });
  console.log("  ✓", name);
}

// 1) Desktop landing
await page.setViewport({ width: 1280, height: 832, deviceScaleFactor: 1.5 });
await waitReady();
await shot("01-landing-page.png");

// 2) Mobile landing (reflow, still clean — no chat yet)
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await sleep(400);
await shot("02-mobile-view.png");

// 3) Desktop chat response
await page.setViewport({ width: 1280, height: 832, deviceScaleFactor: 1.5 });
await sleep(300);
await ask("What is the attendance requirement and what happens if I miss it?");
await shot("03-chat-response.png");

// 4) Sources panel (open the latest <details class="sources">)
await page.evaluate(() => {
  const ds = [...document.querySelectorAll("details.sources")];
  const d = ds[ds.length - 1];
  if (d) { d.open = true; d.scrollIntoView({ block: "center" }); }
});
await sleep(400);
await shot("04-sources-panel.png");

// 5) Upload document modal
await page.click("#upload-btn");
await page.waitForSelector("#overlay.open", { timeout: 5000 });
await sleep(500);
await shot("05-upload-document.png");
await page.click("#modal-close");
await sleep(200);

// 6) Mobile chat (reflow the existing conversation to mobile width)
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await sleep(400);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await shot("06-mobile-chat.png");

await browser.close();
console.log("Done. Screenshots written to", OUT);
