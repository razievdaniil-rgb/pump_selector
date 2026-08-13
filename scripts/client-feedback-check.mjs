import { chromium } from 'playwright-core';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const errors=[];
for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'tablet',width:1024,height:900},{name:'mobile',width:390,height:844}]){
 const page=await browser.newPage({viewport});page.on('pageerror',error=>errors.push(`${viewport.name}: ${error.message}`));
 await page.goto('http://127.0.0.1:5176/',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:/Знаю Q и H/}).click();
 const q=page.locator('input[inputmode="decimal"]').first();await q.fill('');await q.type('32');
 const inputValue=await q.inputValue(),typeVisible=await page.getByText('Тип насоса',{exact:true}).isVisible(),dockVisible=await page.locator('.selection-dock').isVisible(),graphVisible=await page.locator('.selection-graph').isVisible();
 await page.locator('.selection-dock button').click();await page.waitForTimeout(300);
 const cards=await page.locator('.result-card').count(),overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth));
 await page.screenshot({path:`qa-client-${viewport.name}.png`,fullPage:true});
 console.log(JSON.stringify({viewport:viewport.name,inputValue,typeVisible,dockVisible,graphVisible,cards,overflow}));
 if(inputValue!=='32'||!typeVisible||!dockVisible||!graphVisible||cards<1||overflow>1)errors.push(`${viewport.name}: regression`);
 await page.close();
}
await browser.close();if(errors.length){console.error(errors);process.exit(1)}
