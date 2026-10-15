import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://localhost:3000';
const OUT = 'C:/Users/Acer/Downloads/caselearn/shots';
fs.mkdirSync(OUT, { recursive: true });

const pages = [
  ['home', '/'],
  ['courses', '/courses'],
  ['course-detail', '/courses/english-for-the-arts'],
  ['portfolio', '/portfolio'],
  ['journal', '/journal'],
  ['about', '/about'],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

for (const [name, path] of pages) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  // homepage: click "open the folder" to show the contents
  if (name === 'home') {
    try { await page.click('[aria-label="Open the notebook"]'); await page.waitForTimeout(500); } catch {}
    await page.screenshot({ path: `${OUT}/${name}-closed.png`, fullPage: false });
    await page.screenshot({ path: `${OUT}/${name}-full.png`, fullPage: true });
    console.log('shot', name);
    continue;
  }
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log('shot', name);
}

// mobile
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mpage = await mctx.newPage();
for (const [name, path] of [['home-mobile', '/'], ['portfolio-mobile', '/portfolio']]) {
  await mpage.goto(BASE + path, { waitUntil: 'networkidle' });
  await mpage.waitForTimeout(900);
  await mpage.screenshot({ path: `${OUT}/${name}.png`, fullPage: name !== 'home-mobile' });
  console.log('shot', name);
}

await browser.close();
console.log('DONE');
