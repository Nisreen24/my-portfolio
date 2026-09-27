// Usage: node screenshot.mjs http://localhost:3000 [label] [--mobile] [--width=1440] [--height=900] [--no-full]
// Saves to ./temporary screenshots/screenshot-N[-label].png (auto-incremented, never overwritten)
import puppeteer from 'puppeteer';
import { readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const url = args.find(a => a.startsWith('http')) || 'http://localhost:3000';
const flags = args.filter(a => a.startsWith('--'));
const label = args.find(a => !a.startsWith('http') && !a.startsWith('--'));
const mobile = flags.includes('--mobile');
const fullPage = !flags.includes('--no-full');
const getFlag = (n, d) => Number((flags.find(f => f.startsWith(`--${n}=`)) || '').split('=')[1]) || d;
const width = getFlag('width', mobile ? 390 : 1440);
const height = getFlag('height', mobile ? 844 : 900);

if (url.startsWith('file:')) { console.error('Refusing file:// URL — serve on localhost first (node serve.mjs).'); process.exit(1); }

const dir = join(process.cwd(), 'temporary screenshots');
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
const nums = readdirSync(dir).map(f => /^screenshot-(\d+)/.exec(f)).filter(Boolean).map(m => Number(m[1]));
const n = (nums.length ? Math.max(...nums) : 0) + 1;
const suffix = [label, mobile ? 'mobile' : null].filter(Boolean).join('-');
const out = join(dir, `screenshot-${n}${suffix ? '-' + suffix : ''}.png`);

const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => document.fonts?.ready);
  // trigger lazy/scroll-reveal content before capture
  await page.evaluate(async () => { document.documentElement.style.scrollBehavior = 'auto'; for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: out, fullPage });
  console.log(`Saved: ${out}  (${width}x${height}${fullPage ? ', full page' : ''})`);
} finally {
  await browser.close();
}
