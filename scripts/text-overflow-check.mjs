import { chromium } from 'playwright-core';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
for (const width of [1760,1536,1440,1280,1024,760,390,360]) {
 const page=await browser.newPage({viewport:{width,height:1000}});
 await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});
 const issues=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>{const s=getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden')return false;const text=(el.textContent||'').trim();if(!text)return false;return el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1}).map(el=>({tag:el.tagName,cls:el.className,txt:(el.textContent||'').trim().slice(0,80),cw:el.clientWidth,sw:el.scrollWidth,ch:el.clientHeight,sh:el.scrollHeight,overflow:getComputedStyle(el).overflow})).slice(0,40));
 console.log('\nWIDTH',width,JSON.stringify(issues,null,2)); await page.close();
}
await browser.close();