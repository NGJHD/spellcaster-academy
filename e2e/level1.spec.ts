import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __spellcaster?: { beat(): string | null; area(): string | null; focus(): number | null };
  }
}

const beat = (page: Page) => page.evaluate(() => window.__spellcaster?.beat() ?? null);

async function startNewGame(page: Page, query = '', difficulty = 'Standard', wait: 'loaded' | 'begun' = 'loaded') {
  await page.goto(`/?test${query}`);
  await page.getByRole('button', { name: 'START', exact: true }).click();
  const confirm = page.getByRole('button', { name: 'START FROM BEGINNING' });
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await page.getByRole('radio', { name: new RegExp(difficulty) }).click();
  await page.getByRole('button', { name: 'BEGIN', exact: true }).click();
  // The first run of a page opens behind the loading screen; the level begins as it starts to fade.
  if (wait === 'begun') await expect(page.locator('.loading-screen--out')).toHaveCount(1, { timeout: 60_000 });
  else await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 60_000 });
}

/**
 * Plays like a child: presses Enter on blocking story lines and the pre-boss choice,
 * otherwise types the next letter of the locked (or first visible) word.
 */
async function botStep(page: Page): Promise<string | null> {
  const key = await page.evaluate(() => {
    if (document.querySelector('.results')) return 'done';
    if (document.querySelector('.choice-panel')) return 'Enter';
    if (document.querySelector('.subtitle--blocking')) return 'Enter';
    const labels = [...document.querySelectorAll<HTMLElement>('.word-label')];
    if (labels.length === 0) return null;
    const locked = labels.find((l) => l.classList.contains('word-label--locked'));
    const label = locked ?? labels.find((l) => l.classList.contains('word-label--optional')) ?? labels[0];
    const current = label?.querySelector('.word-label__current')?.textContent;
    if (current) return current;
    return label?.querySelector('.word-label__rest')?.textContent?.[0] ?? null;
  });
  if (key && key !== 'done') await page.keyboard.press(key);
  return key;
}

async function playUntil(page: Page, done: () => Promise<boolean>, maxMs: number) {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    if (await done()) return;
    const key = await botStep(page);
    if (key === 'done') return;
    await page.waitForTimeout(key ? 60 : 120);
  }
  throw new Error(`Timed out at beat ${await beat(page)}`);
}

test('title screen offers START and a disabled RESUME on first visit', async ({ page }) => {
  await page.goto('/?test');
  await expect(page.getByRole('button', { name: 'START', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'RESUME', exact: true })).toBeDisabled();
  await expect(page.getByText('No journey to resume')).toBeVisible();
});

test('completes the Arrival Gate tutorial by typing', async ({ page }) => {
  await startNewGame(page, '&speed=4');
  await playUntil(page, async () => (await beat(page)) === 'arrival-gate-passage', 90_000);
  // The gate opens and the rail carries the player into the courtyard.
  await playUntil(page, async () => (await page.evaluate(() => window.__spellcaster?.area())) === 'sunlit-courtyard', 90_000);
  await expect(page.locator('.area-card')).toHaveText('Sunlit Courtyard');
});

test('the first load shows the loading screen, then the level begins', async ({ page }) => {
  await page.goto('/?test');
  await page.getByRole('button', { name: 'START', exact: true }).click();
  await page.getByRole('radio', { name: /Standard/ }).click();
  await page.getByRole('button', { name: 'BEGIN', exact: true }).click();
  const loading = page.locator('.loading-screen');
  await expect(loading).toBeVisible();
  await expect(loading.getByRole('heading', { name: 'Spellcaster Academy' })).toBeVisible();
  await expect(loading).toContainText('Level 1: First Day, First Spell');
  // Nothing plays behind it: the run waits at its first beat until loading ends.
  expect(await beat(page)).toBe('arrival-opening-fade');
  await expect(loading).toHaveCount(0, { timeout: 60_000 });
  await expect.poll(() => beat(page), { timeout: 30_000 }).not.toBe('arrival-opening-fade');
});

test('locks a target by typing and completes a combat encounter', async ({ page }) => {
  await startNewGame(page, '&beat=courtyard-c1&speed=3');
  await expect(page.locator('.word-label').first()).toBeVisible({ timeout: 15_000 });
  const first = (await page.locator('.word-label__current').first().textContent()) ?? '';
  await page.keyboard.press(first || 'a');
  await expect(page.locator('.word-label--locked')).toHaveCount(1);
  await playUntil(page, async () => (await beat(page)) !== 'courtyard-c1', 60_000);
});

test('pauses during combat and resumes', async ({ page }) => {
  await startNewGame(page, '&beat=courtyard-c2&speed=2');
  await expect(page.locator('.word-label').first()).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
  const focus = await page.evaluate(() => window.__spellcaster?.focus());
  await page.waitForTimeout(2500);
  // Nothing attacks while paused.
  expect(await page.evaluate(() => window.__spellcaster?.focus())).toBe(focus);
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeHidden();
});

test('restores an anchor, saves a checkpoint and resumes after a reload', async ({ page }) => {
  await startNewGame(page, '&beat=courtyard-to-anchor&speed=4');
  await playUntil(page, async () => (await beat(page)) === 'courtyard-exit', 60_000);
  await page.waitForTimeout(800);
  await page.goto('/?test');
  const resume = page.getByRole('button', { name: 'RESUME', exact: true });
  await expect(resume).toBeEnabled();
  // Under load the run can reach the East Hall before the reload; either save is correct.
  await expect(page.locator('#resume-caption')).toContainText(/Sunlit Courtyard|East Hall/);
  await resume.click();
  await expect(page.getByText('Welcome back.')).toBeVisible();
  await expect.poll(() => beat(page), { timeout: 30_000 }).toMatch(/^(courtyard-exit|east-hall-)/);
});

test('changes difficulty at a checkpoint from the pause menu', async ({ page }) => {
  // Paused the moment the level begins: the route reaches the next fight about a second later.
  await startNewGame(page, '&beat=library-checkpoint', 'Standard', 'begun');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Difficulty' }).click();
  await page.getByRole('radio', { name: /Gentle/ }).click();
  await expect(page.getByRole('radio', { name: /Gentle/ })).toHaveAttribute('aria-checked', 'true');
});

test('final boss through to the results screen', async ({ page }) => {
  await startNewGame(page, '&beat=observatory-enter&speed=6');
  await playUntil(page, async () => (await page.locator('.results').count()) > 0, 200_000);
  await expect(page.getByRole('heading', { name: 'LEVEL 1 COMPLETE' })).toBeVisible();
  await expect(page.getByText('Character accuracy')).toBeVisible();
  await page.getByRole('button', { name: 'RETURN TO TITLE' }).click();
  await expect(page.getByRole('button', { name: 'RESUME', exact: true })).toBeDisabled();
  await expect(page.getByText('Level 1 Complete')).toBeVisible();
});

test('full Level 1 from START to results (Gentle, 10× time)', async ({ page }) => {
  test.setTimeout(600_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push(m.text());
  });
  await startNewGame(page, '&speed=10', 'Gentle');
  await playUntil(page, async () => (await page.locator('.results').count()) > 0, 560_000);
  await expect(page.getByRole('heading', { name: 'LEVEL 1 COMPLETE' })).toBeVisible();
  // Definition of done: no recurring console errors during a full playthrough.
  expect(errors).toEqual([]);
});
