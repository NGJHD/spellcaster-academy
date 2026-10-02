/**
 * Captures academy views from the running game (HUD hidden) as raw landscapes for the Hall of
 * Portraits paintings; scripts/paint_portraits.py paints them.
 *   node scripts/capture-landscapes.mjs [baseUrl]
 */
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:5199/';
const out = 'assets-src/paintings/raw';
mkdirSync(out, { recursive: true });
const views = [
  ['arrival-flyover', 3500],
  ['arrival-flyover', 5200],
];
const browser = await chromium.launch({ channel: 'msedge', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const [n, [beat, wait]] of views.entries()) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 880 } });
  const page = await context.newPage();
  await page.goto(`${base}?test&nowand&beat=${beat}`);
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'START', exact: true }).click();
  await page.getByRole('button', { name: 'BEGIN', exact: true }).click();
  await page.addStyleTag({ content: '.hud, .label-layer, .subtitle, .area-card, .resume-card { display: none !important; }' });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}/landscape_${n}.png` });
  console.log('captured', beat);
  await context.close();
}
await browser.close();
