import { chromium } from "playwright-core";
const b = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto("http://127.0.0.1:5177/", { waitUntil: "networkidle" });
await p.locator(".scenario").first().click();
await p.locator(".selection-dock .dock-submit").click();
await p.locator(".open-curve-workspace").click();
const before = await p.locator(".plot-qh").first().getAttribute("d");
await p.getByRole("button", { name: "Регулирование" }).click();
await p.locator(".range-controls input").first().fill("42");
const after = await p.locator(".plot-qh").first().getAttribute("d");
const caption = await p.locator(".curve-canvas-heading p").innerText();
const beforeCount = await p.locator(".plot-series").count();
await p.locator(".curve-model input").nth(1).check();
const afterCount = await p.locator(".plot-series").count();
const pointerButton = p.getByRole("button", { name: /Указка/ });
await pointerButton.click();
const pointerOff = await pointerButton.getAttribute("class");
await pointerButton.click();
await p
  .locator(".engineering-chart-v2")
  .first()
  .hover({ position: { x: 480, y: 240 } });
const tooltip = await p.locator(".plot-cursor").count();
console.log(
  JSON.stringify(
    {
      curveChanged: before !== after,
      caption,
      beforeCount,
      afterCount,
      pointerOff,
      tooltip,
    },
    null,
    2,
  ),
);
await b.close();
if (before === after || afterCount - beforeCount !== 4 || tooltip !== 1)
  process.exit(1);
