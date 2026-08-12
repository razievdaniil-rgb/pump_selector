import { chromium } from 'playwright-core';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const reports=[];
for(const width of [1500,1440,1280,1100,1000,900,820,761]){
 const page=await browser.newPage({viewport:{width,height:800}}); await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});
 const max=await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
 for(const ratio of [0,.25,.5,.75,1]){
  await page.evaluate(y=>scrollTo(0,y),max*ratio); await page.waitForTimeout(50);
  const overlaps=await page.evaluate(()=>{const visible=[...document.querySelectorAll('.selection-form,.results-panel,.right-rail>.card')].filter(e=>{const r=e.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight}).map(e=>({name:e.className,r:e.getBoundingClientRect()}));const hits=[];for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){const a=visible[i],b=visible[j];const x=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left);const y=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);if(x>1&&y>1)hits.push([a.name,b.name,Math.round(x),Math.round(y)])}return hits});
  if(overlaps.length)reports.push({width,ratio,overlaps});
 }
 await page.close();
}
if(reports.length)throw new Error(JSON.stringify(reports,null,2));
console.log('No panel intersections while scrolling at 1500–761 px');
await browser.close();