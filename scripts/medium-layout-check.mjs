import { chromium } from 'playwright-core';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
for(const width of [1000,900,820,800,780,769,761,760,740]){
 const page=await browser.newPage({viewport:{width,height:900}}); await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});
 const d=await page.evaluate(()=>{const sels=['.selector-grid','.selection-form','.results-panel','.right-rail','.right-rail .side-card:first-child','.qh-chart'];const o={};for(const s of sels){const e=document.querySelector(s);if(e){const r=e.getBoundingClientRect();o[s]={x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,sw:e.scrollWidth,cw:e.clientWidth}}}return {body:document.body.scrollWidth,view:innerWidth,o}});console.log(width,JSON.stringify(d)); await page.close();
}
await browser.close();