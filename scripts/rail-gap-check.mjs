import { chromium } from 'playwright-core';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
for(const width of [1500,1440,1280,1180,1100,1000,920,901]){
 const page=await browser.newPage({viewport:{width,height:900}});await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});
 const d=await page.evaluate(()=>({rail:getComputedStyle(document.querySelector('.right-rail')).display,cards:[...document.querySelectorAll('.right-rail>.card')].map(e=>{const r=e.getBoundingClientRect();return {cls:e.className,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),bottom:Math.round(r.bottom)}})}));console.log(width,JSON.stringify(d));await page.close();
}await browser.close();