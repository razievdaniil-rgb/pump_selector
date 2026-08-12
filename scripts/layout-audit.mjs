import { chromium } from 'playwright-core';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const sizes=[{name:'mobile',width:390,height:844},{name:'tablet',width:768,height:900},{name:'desktop',width:1440,height:1000}];
const scenarios=[];
for(const size of sizes){
 const page=await browser.newPage({viewport:size});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5176/',{waitUntil:'networkidle'});
 const capture=async(name)=>{const report=await page.evaluate(()=>{const overflow=[...document.querySelectorAll('*')].filter(el=>{const r=el.getBoundingClientRect();return r.right>innerWidth+1||r.left< -1}).slice(0,8).map(el=>({tag:el.tagName,cls:typeof el.className==='string'?el.className:'',text:(el.textContent||'').trim().slice(0,40),right:Math.round(el.getBoundingClientRect().right)}));const clipped=[...document.querySelectorAll('button,a,input,select')].filter(el=>{const r=el.getBoundingClientRect();return r.width<20||r.height<20||r.right>innerWidth+1}).slice(0,8).map(el=>({tag:el.tagName,cls:typeof el.className==='string'?el.className:'',text:(el.textContent||'').trim().slice(0,40),w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)}));return{bodyOverflow:document.body.scrollWidth-innerWidth,overflow,clipped}});await page.screenshot({path:`qa-${size.name}-${name}.png`,fullPage:true});scenarios.push({size:size.name,name,...report})};
 await capture('start');
 await page.getByRole('button',{name:/Знаю, куда нужен насос/}).click();await capture('purpose');
 await page.getByRole('button',{name:/Котельная/}).click();await capture('parameters');
 await page.getByRole('button',{name:'Подобрать насос',exact:true}).first().click();await page.waitForTimeout(250);await capture('results');
 await page.getByRole('button',{name:/Подбор/}).first().click();await page.getByRole('button',{name:/Знаю модель/}).click();await page.locator('.model-search input').fill('RFZ');await capture('model');
 scenarios.push({size:size.name,errors});await page.close();
}
console.log(JSON.stringify(scenarios,null,2));await browser.close();
