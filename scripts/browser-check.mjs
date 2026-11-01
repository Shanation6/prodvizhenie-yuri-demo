import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
if(!process.env.PLAYWRIGHT_MODULE)throw new Error('Set PLAYWRIGHT_MODULE to the installed playwright-core entry point.');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[],failed=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{if(response.status()>=400&&response.url().includes('/assets/'))failed.push(response.url());});
const base=process.env.SITE_URL||'http://127.0.0.1:4186/';
const screenshot=options=>page.screenshot({animations:'disabled',...options});
await mkdir('outputs',{recursive:true});
await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
assert.equal(await page.locator('h1').count(),1);
assert.match(await page.title(),/ПроДвижение/);
await screenshot({path:'outputs/desktop-hero.png'});
for(const [name,pattern] of [['Персонально',/вашему движению/],['Мини-группа',/Внимание — каждому/],['SUP',/Найти свой ритм/]]){
 await page.getByRole('tab',{name:new RegExp(name)}).click();
 assert.equal(await page.getByRole('tab',{selected:true}).count(),1);
 assert.match(await page.locator('#format-title').innerText(),pattern);
 await page.locator('#format-image').evaluate(image=>image.decode());
 assert.equal(await page.locator('#format-contact').getAttribute('href'),'tel:+79994420181');
}
await page.getByRole('tab',{name:/SUP/}).press('Home');
assert.equal(await page.getByRole('tab',{name:/Персонально/}).getAttribute('aria-selected'),'true');
await page.locator('summary').first().click();
assert.equal(await page.locator('details').first().getAttribute('open'),'');
const widths=[360,390,768,1024,1440];
for(const width of widths){
 await page.setViewportSize({width,height:900});await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 const dimensions=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(dimensions.scroll<=width,`Overflow: ${JSON.stringify(dimensions)}`);
 const images=await page.locator('img').evaluateAll(async images=>{images.forEach(image=>image.loading='eager');await Promise.all(images.map(image=>image.decode().catch(()=>{})));return images.filter(image=>!image.complete||!image.naturalWidth).map(image=>image.src);});
 assert.deepEqual(images,[]);
 if(width===390){
  await screenshot({path:'outputs/mobile-hero.png'});
  await page.getByRole('button',{name:'Открыть меню'}).click();assert.equal(await page.locator('#mobile-nav').isVisible(),true);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#mobile-nav').isVisible(),false);
  await page.getByRole('button',{name:'Открыть меню'}).click();await page.locator('#mobile-nav a[href="#formats"]').click();assert.equal(await page.locator('#mobile-nav').isVisible(),false);
  await page.getByRole('tab',{name:/Мини-группа/}).click();assert.match(await page.locator('#format-title').innerText(),/Внимание — каждому/);
  await screenshot({path:'outputs/mobile-formats.png'});
 }
}
for(const [width,label] of [[1440,'desktop'],[390,'mobile']]){
 await page.setViewportSize({width,height:900});await page.goto(base,{waitUntil:'networkidle'});
 await page.evaluate(async()=>{document.querySelectorAll('.reveal').forEach(element=>element.classList.add('visible'));document.querySelectorAll('img').forEach(image=>image.loading='eager');await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));});
 await screenshot({path:`outputs/${label}-full.png`,fullPage:true});
}
await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base,{waitUntil:'networkidle'});
assert.equal(await page.locator('body').evaluate(element=>element.classList.contains('motion-ready')),false);
assert.equal(await page.locator('form').count(),0);
assert.ok(await page.locator('a[href="tel:+79994420181"]').count()>=3);
const brokenAnchors=await page.locator('a[href^="#"]').evaluateAll(links=>links.map(link=>link.getAttribute('href')).filter(href=>!document.getElementById(href.slice(1))));assert.deepEqual(brokenAnchors,[]);
if(!process.env.SITE_URL){await page.setViewportSize({width:1200,height:630});await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await screenshot({path:'assets/share.jpg',type:'jpeg',quality:88});}
assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
console.log(JSON.stringify({passed:true,base,widths,formats:3,menu:true,faq:true,images:true,reducedMotion:true,consoleErrors:0}));await browser.close();
