import { chromium } from 'playwright-core';

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1536, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'qa-selector-desktop.png', fullPage: true });
const desktop = await page.evaluate(() => ({ width: document.body.scrollWidth, viewport: innerWidth, cards: document.querySelectorAll('.result-card').length, columns: getComputedStyle(document.querySelector('.selector-grid')).gridTemplateColumns }));
await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: 'networkidle' });
await page.screenshot({ path: 'qa-selector-mobile.png', fullPage: true });
const mobile = await page.evaluate(() => ({ width: document.body.scrollWidth, viewport: innerWidth, cards: document.querySelectorAll('.result-card').length, formTop: document.querySelector('.selection-form')?.getBoundingClientRect().top, resultsTop: document.querySelector('.results-panel')?.getBoundingClientRect().top }));
if (errors.length || desktop.cards !== 4 || mobile.cards !== 4 || mobile.width > mobile.viewport + 1 || mobile.formTop > mobile.resultsTop) throw new Error(JSON.stringify({ errors, desktop, mobile }));
console.log(JSON.stringify({ desktop, mobile }, null, 2));
await browser.close();
