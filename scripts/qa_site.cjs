const path=require('path'),fs=require('fs');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join(process.env.CODEX_NODE_MODULES||'C:/Users/nikla/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules','playwright')));}
const root=path.resolve(__dirname,'..'),dest=path.join(root,'work/final-rebuild/qa');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const base='http://127.0.0.1:8765/Finansiering-2026/';
 await page.goto(base,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
 const course=await page.evaluate(()=>({title:document.querySelector('h1')?.textContent,photo:!!document.querySelector('img.finance-header'),modules:document.querySelectorAll('.schedule-wrap tbody tr').length,dates:[...document.querySelectorAll('.schedule-wrap tbody tr')].map(tr=>tr.innerText),intro:document.querySelector('.slide-embed iframe')?.getAttribute('src')}));
 if(!course.photo||course.modules!==12||!course.intro||course.title!=='Finansiering 2026')errors.push('Missing 2026 home content');
 await page.locator('.slide-embed').scrollIntoViewIfNeeded();
 await page.frameLocator('.slide-embed iframe').locator('.reveal.ready').waitFor();
 await page.locator('.schedule-wrap').screenshot({path:path.join(dest,'site-schedule.png')});
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:path.join(dest,'site-desktop.png'),fullPage:true});
 const urls=await page.locator('a[href]').evaluateAll(as=>[...new Set(as.map(a=>a.href))]);
 const responses=[];
 for(const url of urls.filter(u=>u.startsWith(base)&&/\.(html|pdf)(?:#.*)?$/.test(u))){
   const r=await page.request.get(url);const body=await r.body();
   const pdf=url.includes('.pdf');const ok=r.ok()&&(!pdf||body.subarray(0,5).toString()==='%PDF-');
   responses.push({url,status:r.status(),bytes:body.length,ok});
 }
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(dest,'site-mobile.png'),fullPage:true});
 await page.locator('.schedule-wrap').screenshot({path:path.join(dest,'site-schedule-mobile.png')});
 const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 const result={errors,mobileOverflow,course,responses,passed:!errors.length&&!mobileOverflow&&responses.every(r=>r.ok)};
 fs.writeFileSync(path.join(dest,'site.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 await browser.close();if(!result.passed)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
