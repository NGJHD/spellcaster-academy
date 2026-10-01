/** Visible-triangle breakdown per named object at beats: node scripts/breakdown.mjs <beat> … (dev server on :5199). */
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'msedge', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const beat of process.argv.slice(2)) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(`http://localhost:5199/?test&beat=${beat}`);
  await page.getByRole('button', { name: 'START', exact: true }).click();
  await page.getByRole('button', { name: 'BEGIN', exact: true }).click();
  await page.waitForTimeout(6000);
  const b = await page.evaluate(() => window.__spellcaster.breakdown());
  console.log(beat, Object.entries(b).sort((a, c) => c[1] - a[1]).slice(0, 12).map(([k, v]) => `${k}:${(v / 1000).toFixed(0)}k`).join('  '));
  await page.close();
}
await browser.close();
