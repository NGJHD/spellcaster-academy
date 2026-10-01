/**
 * Captures screenshots of chosen beats for visual review.
 * Usage: node scripts/screens.mjs [baseUrl] [beat ...]
 * Output: test-results/screens/<beat>.png (git-ignored).
 */
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:5199/';
const beats = process.argv.slice(3);
const out = 'test-results/screens';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  channel: 'msedge',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const errors = [];

for (const entry of beats.length ? beats : ['']) {
  const [beat, wait = '3000'] = entry.split('@');
  // Fresh context per shot: no autosave carried between captures.
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('404')) errors.push(m.text());
  });
  await page.goto(`${base}?test${beat ? `&beat=${beat}` : ''}`);
  await page.waitForTimeout(500);
  if (beat) {
    await page.getByRole('button', { name: 'START', exact: true }).click();
    await page.getByRole('button', { name: 'BEGIN', exact: true }).click();
  }
  await page.waitForTimeout(Number(wait));
  const name = beat || 'title';
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log('saved', name);
  await context.close();
}
if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].join('\n'));
await browser.close();
