import { chromium } from "playwright-core";

const baseUrl = process.env.QA_URL || "http://127.0.0.1:5177/";
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 1024, height: 900 },
  { name: "mobile", width: 390, height: 844 },
  { name: "small-mobile", width: 360, height: 800 },
];

const report = [];
const add = (viewport, area, passed, details = "") =>
  report.push({ viewport, area, passed, details });

async function createPage(viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  return { page, errors };
}

for (const viewport of viewports) {
  const { page, errors } = await createPage(viewport);
  const name = viewport.name;

  add(
    name,
    "start: three paths",
    (await page.locator(".scenario").count()) === 3,
  );
  add(
    name,
    "start: assistant entry",
    await page.locator(".assistant-entry").isVisible(),
  );

  await page.locator(".scenario").first().click();
  add(
    name,
    "Q/H: form opens",
    await page.locator(".selection-form").isVisible(),
  );

  const qInput = page.locator(".selection-form input").first();
  await qInput.click();
  await qInput.fill("");
  add(name, "Q/H: empty value stays empty", (await qInput.inputValue()) === "");
  add(
    name,
    "Q/H: submit disabled for zero",
    await page.locator(".selection-dock .dock-submit").isDisabled(),
  );
  await qInput.fill("32.4");

  const submit =
    viewport.width <= 760
      ? page.locator(".selection-dock .dock-submit")
      : page.locator(".dock-submit");
  await submit.click();
  add(
    name,
    "results: panel opens",
    await page.locator(".results-panel").isVisible(),
  );
  add(
    name,
    "results: graph visible",
    await page.locator(".selection-graph").isVisible(),
  );
  add(
    name,
    "results: four graph layers",
    (await page.locator(".curve-mode-tabs button").count()) >= 4,
  );

  const firstResult = page.locator(".result-card").first();
  add(name, "results: at least one model", await firstResult.isVisible());
  await firstResult.locator('input[type="checkbox"]').check();
  add(
    name,
    "compare: counter updates",
    (
      await page.locator(".selector-header .counter").nth(0).textContent()
    )?.trim() === "1",
  );

  add(
    name,
    "curves: unified workspace visible",
    await page.locator(".selection-graph .curve-workspace").isVisible(),
  );
  add(
    name,
    "curves: exactly one graph",
    (await page.locator(".selection-graph .engineering-chart-v2").count()) ===
      1,
  );
  add(
    name,
    "curves: one active metric",
    (await page.locator(".selection-graph .plot-series").count()) >= 1,
  );
  add(
    name,
    "curves: no separate screen button",
    (await page.locator(".open-curve-workspace").count()) === 0,
  );
  add(
    name,
    "curves: no question artifacts",
    !(await page.locator("body").innerText()).includes("????"),
  );

  const overflow = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - innerWidth),
  );
  add(
    name,
    "layout: no horizontal overflow",
    overflow <= 1,
    `overflow=${overflow}`,
  );

  const clipped = await page.evaluate(() => {
    const ignored = new Set(["tabs", "curve-actions", "chart-legend"]);
    return [
      ...document.querySelectorAll("button, label, .result-card, .side-card"),
    ]
      .filter((element) => {
        const node = element;
        if ([...node.classList].some((className) => ignored.has(className)))
          return false;
        const style = getComputedStyle(node);
        return (
          style.overflow !== "hidden" && node.scrollWidth > node.clientWidth + 2
        );
      })
      .slice(0, 10)
      .map((element) => ({
        className: element.className,
        text: element.textContent?.trim().slice(0, 80),
      }));
  });
  add(
    name,
    "layout: no clipped controls",
    clipped.length === 0,
    JSON.stringify(clipped),
  );

  add(name, "runtime: no JS errors", errors.length === 0, errors.join(" | "));
  await page.screenshot({ path: `qa-${name}.png`, fullPage: true });
  await page.close();
}

{
  const { page, errors } = await createPage({ width: 1440, height: 1000 });
  await page.locator(".scenario").nth(1).click();
  add(
    "desktop",
    "purpose: four applications",
    (await page.locator(".purpose-card").count()) === 4,
  );
  await page.locator(".purpose-card").first().click();
  const boilerOptions = await page
    .locator(".selection-form select")
    .first()
    .locator("option")
    .allTextContents();
  add(
    "desktop",
    "purpose: boiler excludes sewage",
    !boilerOptions.includes("Канализационный"),
    boilerOptions.join(", "),
  );
  add(
    "desktop",
    "purpose: compatibility explained",
    await page.locator(".purpose-compatibility-note").isVisible(),
  );
  await page.locator(".dock-restart").click();
  await page.locator(".scenario").nth(2).click();
  await page.locator(".model-search input").fill("RFZ-026347");
  add(
    "desktop",
    "model: XML_ID search",
    (await page.locator(".model-results button").count()) === 1,
  );
  await page.locator(".model-search input").fill("NO-SUCH-PUMP");
  add(
    "desktop",
    "model: empty state",
    (await page.locator(".model-example").innerText()).includes("Совпадений"),
  );
  await page.locator(".back-link").click();
  await page.locator(".assistant-entry").click();
  add(
    "desktop",
    "assistant: opens separately",
    await page.locator(".demo-dialog").isVisible(),
  );
  await page.locator(".demo-dialog .button.primary").click();
  add(
    "desktop",
    "assistant: hands off to purpose",
    await page.locator(".purpose-shell").isVisible(),
  );
  add(
    "desktop",
    "extended runtime: no JS errors",
    errors.length === 0,
    errors.join(" | "),
  );
  await page.close();
}

const failed = report.filter((item) => !item.passed);
console.log(
  JSON.stringify(
    {
      summary: { total: report.length, failed: failed.length },
      failed,
      report,
    },
    null,
    2,
  ),
);
await browser.close();
if (failed.length) process.exit(1);
