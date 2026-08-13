import { chromium } from "playwright-core";
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const results = [];
for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5177/", { waitUntil: "networkidle" });
  await page.locator(".scenario").first().click();
  await page.locator(".selection-dock .dock-submit").click();
  await page.locator(".open-curve-workspace").click();
  const buttons = await page.locator(".curve-actions button").allTextContents();
  await page.getByRole("button", { name: /Рабочая точка/ }).click();
  await page.getByRole("button", { name: "Добавить режим" }).click();
  const points = await page.locator(".point-list > span").count();
  await page.getByRole("button", { name: /Параметры системы/ }).click();
  const npsh = await page.locator(".calculation-result").innerText();
  await page.getByRole("button", { name: "Регулирование" }).click();
  await page
    .locator(".range-controls input")
    .first()
    .evaluate((el) => {
      el.value = "42";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
  const frequency = await page.locator(".curve-canvas-heading p").innerText();
  await page.getByRole("button", { name: "Рабочая жидкость" }).click();
  await page.getByRole("button", { name: "Применить" }).click();
  await page.getByRole("button", { name: "Параллельная работа" }).click();
  await page.locator(".inline-fields select").first().selectOption("2");
  const parallel = await page.locator(".parallel-summary").innerText();
  await page.getByRole("button", { name: "Отдельно" }).click();
  const split = await page.locator(".split-chart").count();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - innerWidth,
  );
  const question = await page
    .locator("body")
    .innerText()
    .then((t) => t.includes("????"));
  await page.screenshot({
    path: `qa-engineering-${viewport.name}.png`,
    fullPage: true,
  });
  results.push({
    viewport: viewport.name,
    buttons,
    points,
    npsh,
    frequency,
    parallel,
    split,
    overflow,
    question,
    errors,
  });
  await page.close();
}
console.log(JSON.stringify(results, null, 2));
await browser.close();
if (
  results.some(
    (r) =>
      r.points < 2 ||
      r.split < 4 ||
      r.overflow > 1 ||
      r.question ||
      r.errors.length,
  )
)
  process.exit(1);
