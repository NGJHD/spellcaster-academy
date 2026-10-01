/**
 * Rough performance survey (§15): average frame time, triangles and draw calls at chosen beats.
 * Usage: node scripts/perf.mjs http://localhost:5199/ <beat> …   (dev server must be running)
 */
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:5199/';
const beats = process.argv.slice(3);
const quality = process.env.QUALITY ?? 'medium';
const browser = await chromium.launch({ channel: 'msedge', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const beat of beats) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  await context.addInitScript((q) => {
    localStorage.setItem('spellcaster-academy.settings', JSON.stringify({ state: { quality: q }, version: 2 }));
  }, quality);
  const page = await context.newPage();
  await page.goto(`${base}?test&beat=${beat}`);
  await page.getByRole('button', { name: 'START', exact: true }).click();
  await page.getByRole('button', { name: 'BEGIN', exact: true }).click();
  await page.waitForTimeout(6000);
  const samples = await page.evaluate(async () => {
    const out = [];
    const end = performance.now() + 3000;
    let last = performance.now();
    while (performance.now() < end) {
      await new Promise((r) => requestAnimationFrame(r));
      const now = performance.now();
      out.push(now - last);
      last = now;
    }
    return { frames: out, render: window.__spellcaster?.render() };
  });
  const avg = samples.frames.reduce((a, b) => a + b, 0) / samples.frames.length;
  const worst = [...samples.frames].sort((a, b) => b - a)[Math.floor(samples.frames.length * 0.05)] ?? avg;
  console.log(`${beat.padEnd(28)} ${(1000 / avg).toFixed(0).padStart(4)} fps  p95 ${worst.toFixed(1)} ms  tris ${samples.render?.triangles}  calls ${samples.render?.calls}`);
  await context.close();
}
await browser.close();
