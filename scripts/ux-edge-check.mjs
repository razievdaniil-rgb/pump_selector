import { chromium } from "playwright-core";

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://127.0.0.1:5177/", { waitUntil: "networkidle" });

const checks = [];
const add = (name, passed, details = "") =>
  checks.push({ name, passed, details });

await page.getByRole("button", { name: /Получить КП/ }).click();
add(
  "dialog semantics",
  (await page.locator('[role="dialog"][aria-modal="true"]').count()) === 1,
);
add(
  "dialog receives focus",
  await page
    .locator(".demo-dialog")
    .evaluate((node) => node === document.activeElement),
);
add(
  "quote has required name",
  (await page.locator('input[name="name"]').getAttribute("required")) !== null,
);
add(
  "quote has required phone",
  (await page.locator('input[name="phone"]').getAttribute("required")) !== null,
);
add(
  "INN hidden without company",
  (await page.locator('input[name="inn"]').count()) === 0,
);
await page.locator('input[name="company"]').fill("РФ Завод");
add(
  "INN shown for company",
  (await page.locator('input[name="inn"]').count()) === 1,
);
await page.keyboard.press("Escape");
add("Escape closes dialog", (await page.locator(".demo-dialog").count()) === 0);

await page.locator(".scenario").first().click();
await page.locator(".selection-form input").first().fill("999");
await page.locator(".selection-form input").nth(1).fill("999");
await page.locator(".inline-select-action").click();
add("empty graph state", await page.locator(".graph-empty").isVisible());
add(
  "curve workspace hidden without curves",
  (await page.locator(".curve-workspace").count()) === 0,
);
add(
  "no fake curves without results",
  (await page.locator(".plot-series").count()) === 0,
);

await page.locator(".dock-restart").click();
await page.locator(".scenario").first().click();
await page.locator(".inline-select-action").click();
await page
  .locator(".result-card")
  .first()
  .locator('input[type="checkbox"]')
  .check();
await page.locator(".dock-restart").click();
await page.locator(".scenario").nth(1).click();
await page.locator(".purpose-card").first().click();
add(
  "compatible comparison preserved",
  (
    await page.locator(".selector-header .counter").first().innerText()
  ).trim() === "1",
);

add("no runtime errors", errors.length === 0, errors.join(" | "));
console.log(
  JSON.stringify(
    { checks, failed: checks.filter((item) => !item.passed) },
    null,
    2,
  ),
);
await browser.close();
if (checks.some((item) => !item.passed)) process.exit(1);
