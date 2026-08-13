import { chromium } from "playwright-core";

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});

const cases = [
  {
    purpose: 0,
    allowed: ["Р¦РµРЅС‚СЂРѕР±РµР¶РЅС‹Р№ In-Line", "РљРѕРЅСЃРѕР»СЊРЅС‹Р№", "РњРЅРѕРіРѕСЃС‚СѓРїРµРЅС‡Р°С‚С‹Р№"],
    forbidden: ["РљР°РЅР°Р»РёР·Р°С†РёРѕРЅРЅС‹Р№", "РџРѕРіСЂСѓР¶РЅРѕР№", "Р”РѕР·РёСЂРѕРІРѕС‡РЅС‹Р№"],
  },
  {
    purpose: 1,
    allowed: ["РњРЅРѕРіРѕСЃС‚СѓРїРµРЅС‡Р°С‚С‹Р№", "РљРѕРЅСЃРѕР»СЊРЅС‹Р№", "РџРѕРіСЂСѓР¶РЅРѕР№"],
    forbidden: ["РљР°РЅР°Р»РёР·Р°С†РёРѕРЅРЅС‹Р№", "Р”РѕР·РёСЂРѕРІРѕС‡РЅС‹Р№", "Р¦РµРЅС‚СЂРѕР±РµР¶РЅС‹Р№ In-Line"],
  },
  {
    purpose: 2,
    allowed: ["РџРѕРіСЂСѓР¶РЅРѕР№", "РљР°РЅР°Р»РёР·Р°С†РёРѕРЅРЅС‹Р№"],
    forbidden: ["Р¦РµРЅС‚СЂРѕР±РµР¶РЅС‹Р№ In-Line", "РљРѕРЅСЃРѕР»СЊРЅС‹Р№", "РњРЅРѕРіРѕСЃС‚СѓРїРµРЅС‡Р°С‚С‹Р№"],
  },
  {
    purpose: 3,
    allowed: ["РљР°РЅР°Р»РёР·Р°С†РёРѕРЅРЅС‹Р№", "РџРѕРіСЂСѓР¶РЅРѕР№"],
    forbidden: ["Р¦РµРЅС‚СЂРѕР±РµР¶РЅС‹Р№ In-Line", "РљРѕРЅСЃРѕР»СЊРЅС‹Р№", "РњРЅРѕРіРѕСЃС‚СѓРїРµРЅС‡Р°С‚С‹Р№"],
  },
];

const report = [];
for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  for (const testCase of cases) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:5177/", { waitUntil: "networkidle" });
    await page.locator(".scenario").nth(1).click();
    await page.locator(".purpose-card").nth(testCase.purpose).click();

    const options = await page
      .locator('.selection-form select')
      .first()
      .locator("option")
      .allTextContents();
    const noteVisible = await page.locator(".purpose-compatibility-note").isVisible();
    const overflow = await page.evaluate(
      () => Math.max(0, document.documentElement.scrollWidth - innerWidth),
    );

    await page.locator(viewport.name === "mobile" ? ".selection-dock .dock-submit" : ".inline-select-action").click();
    const resultText = await page.locator(".results-panel").innerText();
    const forbiddenVisible = testCase.forbidden.filter((type) =>
      resultText.includes(type),
    );

    report.push({
      viewport: viewport.name,
      purpose: testCase.purpose,
      options,
      expected: testCase.allowed,
      noteVisible,
      forbiddenVisible,
      overflow,
      errors,
    });
    await page.close();
  }
}

console.log(JSON.stringify(report, null, 2));
const failed = report.some(
  (item) =>
    item.options.length !== item.expected.length ||
    !item.noteVisible ||
    item.forbiddenVisible.length > 0 ||
    item.overflow > 1 ||
    item.errors.length > 0,
);

await browser.close();
if (failed) process.exit(1);


