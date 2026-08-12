import { chromium } from 'playwright-core';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1536,height:1000}});
await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});
const data=await page.evaluate(()=>({images:[...document.images].map(i=>({src:i.currentSrc,complete:i.complete,width:i.naturalWidth,height:i.naturalHeight})),font:document.fonts.check('13px Inter'),bodyFont:getComputedStyle(document.body).fontFamily,h1Weight:getComputedStyle(document.querySelector('h1')).fontWeight,panelWeight:getComputedStyle(document.querySelector('.panel-title')).fontWeight,errors:performance.getEntriesByType('resource').filter(r=>r.name.includes('pump.png')).map(r=>({name:r.name,size:r.transferSize}))}));
console.log(JSON.stringify(data,null,2));
await browser.close();
