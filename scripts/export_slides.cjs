/* Render and validate the actual Reveal deck. No separate PDF content source. */
const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const modules=process.env.CODEX_NODE_MODULES || 'C:/Users/nikla/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
let chromium; try {({chromium}=require('playwright'));} catch {({chromium}=require(path.join(modules,'playwright')));}
const out=path.join(root,'docs'),qa=path.join(root,'work/final-rebuild/qa');
fs.mkdirSync(qa,{recursive:true});fs.mkdirSync(path.join(out,'downloads'),{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.pdf':'application/pdf','.woff2':'font/woff2','.json':'application/json'};
const server=http.createServer((req,res)=>{
 let url=decodeURIComponent(req.url.split('?')[0]);
 url=url.replace(/^\/Finansiering-2026\//,'/');
 let file=path.resolve(out,'.'+url);if(!file.startsWith(out+path.sep)){res.writeHead(403);res.end();return;}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)){res.writeHead(404);res.end(file);return;}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
async function ready(page){
 await page.waitForFunction(()=>window.Reveal && Reveal.isReady(),{timeout:60000});
 await page.evaluate(async()=>{if(window.MathJax?.startup?.promise)await MathJax.startup.promise;await document.fonts.ready;});
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete),{timeout:60000});
 await page.evaluate(()=>Reveal.layout());
 const unrendered=await page.locator('span.math').evaluateAll(nodes=>nodes.filter(n=>!n.querySelector('mjx-container')).length);
 if(unrendered)throw new Error(`${unrendered} math spans did not render`);
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const port=server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const chapters=process.argv.slice(2).length?process.argv.slice(2):Array.from({length:11},(_,i)=>String(i).padStart(2,'0'));
 for(const ch of chapters){
   const folder=path.join(qa,'ch'+ch);fs.mkdirSync(folder,{recursive:true});
   const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
   // Make offline support a tested property: block every external request.
   await page.route('**/*',route=>route.request().url().startsWith(`http://127.0.0.1:${port}/`)?route.continue():route.abort());
   const failures=[];page.on('pageerror',e=>{failures.push(String(e));console.error('BROWSER',String(e));});page.on('requestfailed',r=>{failures.push(r.url()+': '+r.failure()?.errorText);console.error('REQUEST',r.url(),r.failure()?.errorText);});
   const url=`http://127.0.0.1:${port}/Finansiering-2026/slides/chapters/${ch}.html`;
   await page.goto(url,{waitUntil:'networkidle'});await ready(page);
   const count=await page.evaluate(()=>Reveal.getTotalSlides());
   const slides=[];
   for(let n=0;n<count;n++){
     await page.evaluate(i=>{Reveal.slide(i);Reveal.layout();},n);
     await page.waitForFunction(i=>Reveal.getIndices().h===i,n);
     const stat=await page.evaluate(()=>{
       const s=Reveal.getCurrentSlide(),r=s.getBoundingClientRect();
       const elements=[...s.querySelectorAll('h1,h2,h3,p,li,table,img,mjx-container')].filter(e=>!e.closest('aside.notes')&&e.getBoundingClientRect().height>0);
       const box=elements.map(e=>({tag:e.tagName,text:e.innerText?.slice(0,100),r:e.getBoundingClientRect()}));
       return {id:s.id,title:s.querySelector('h1,h2')?.textContent,text:s.innerText,overflow:box.filter(x=>x.r.bottom>r.top+720*Reveal.getScale()+3||x.r.right>r.right+4||x.r.left<r.left-4).map(x=>({tag:x.tag,text:x.text})),mathErrors:[...s.querySelectorAll('mjx-merror,[data-mml-node="merror"],[data-mjx-error]')].map(e=>e.textContent),images:[...s.querySelectorAll('img')].map(i=>({ok:i.complete&&i.naturalWidth>0,w:i.naturalWidth,h:i.naturalHeight}))};
     });
     slides.push(stat);
     await page.screenshot({path:path.join(folder,`${String(n+1).padStart(3,'0')}.png`)});
   }
   await page.goto(url+'?print-pdf',{waitUntil:'networkidle'});await ready(page);
   await page.waitForFunction(()=>document.querySelectorAll('.pdf-page').length>0,{timeout:60000});
   await page.pdf({path:path.join(out,'downloads',`kapitel-${ch}.pdf`),printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
   fs.copyFileSync(path.join(out,'downloads',`kapitel-${ch}.pdf`),path.join(root,'src/downloads',`kapitel-${ch}.pdf`));
   const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
   fs.writeFileSync(path.join(qa,`ch${ch}.json`),JSON.stringify({chapter:ch,count,captured_at:new Date().toISOString(),source_sha256:hash(path.join(root,`src/slides/chapters/${ch}.qmd`)),html_sha256:hash(path.join(out,`slides/chapters/${ch}.html`)),pdf_sha256:hash(path.join(out,`downloads/kapitel-${ch}.pdf`)),failures,slides},null,2));
   console.log(JSON.stringify({chapter:ch,count,overflow:slides.filter(s=>s.overflow.length).map(s=>s.id),mathErrors:slides.filter(s=>s.mathErrors.length).map(s=>s.id),failures}));
   await page.close();
 }
 await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1);});
