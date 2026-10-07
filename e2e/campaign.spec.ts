import { expect, test, type Page } from '@playwright/test';

/**
 * Campaign flows (CLAUDE.md §17): START begins the next level not yet completed, and Levels 2 and 3
 * play from the title screen through to their results.
 */

declare global {
  interface Window {
    __spellcaster?: { beat(): string | null; area(): string | null; focus(): number | null };
  }
}

const beat = (page: Page) => page.evaluate(() => window.__spellcaster?.beat() ?? null);

/** A saved profile with the given chapters completed (the game reads it from localStorage). */
async function seedProfile(page: Page, completed: string[]) {
  await page.addInitScript((levels) => {
    localStorage.setItem(
      'spellcaster-academy.profile',
      JSON.stringify({ schemaVersion: 1, levelCompleted: levels.includes('level-1'), bestResults: null, completedLevels: levels, bestByLevel: {}, cosmetics: [], selectedTrail: null, tutorialSeen: true }),
    );
  }, completed);
}

async function startFromTitle(page: Page, query: string, difficulty: string) {
  await page.goto(`/?test${query}`);
  await page.getByRole('button', { name: /^START( LEVEL \d)?$/ }).click();
  const confirm = page.getByRole('button', { name: 'START FROM BEGINNING' });
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await page.getByRole('radio', { name: new RegExp(difficulty) }).click();
  await page.getByRole('button', { name: 'BEGIN', exact: true }).click();
}

/** Plays like a child: Enter on blocking lines, otherwise the next letter of the locked (or first) word. */
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

async function playToResults(page: Page, maxMs: number) {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    if ((await page.locator('.results').count()) > 0) return;
    const key = await botStep(page);
    await page.waitForTimeout(key ? 60 : 120);
  }
  throw new Error(`Timed out at beat ${await beat(page)}`);
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push(m.text());
  });
  return errors;
}

test('START begins Level 2 once Level 1 is complete; the Chapters list unlocks it', async ({ page }) => {
  await seedProfile(page, ['level-1']);
  await page.goto('/?test');
  await page.getByRole('button', { name: 'Chapters' }).click();
  await expect(page.getByRole('button', { name: /Level 2: The Siege of Asterfall/ })).toBeEnabled();
  await expect(page.getByRole('button', { name: /Level 3: Into the Unwritten/ })).toBeDisabled();
  await page.getByRole('button', { name: 'CANCEL' }).click();
  // The button says where it goes (owner: "why did I end up at level 2 at the start?").
  await expect(page.getByRole('button', { name: 'START LEVEL 2', exact: true })).toBeVisible();
  await startFromTitle(page, '', 'Standard');
  await expect.poll(() => beat(page), { timeout: 15_000 }).toMatch(/^l2-/);
});

test('full Level 2 from START to results (Gentle, 10× time)', async ({ page }) => {
  test.setTimeout(900_000);
  const errors = collectErrors(page);
  await seedProfile(page, ['level-1']);
  await startFromTitle(page, '&speed=10', 'Gentle');
  await playToResults(page, 860_000);
  await expect(page.getByRole('heading', { name: 'LEVEL 2 COMPLETE' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'CONTINUE TO LEVEL 3' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('full Level 3 from START to results (Gentle, 10× time)', async ({ page }) => {
  test.setTimeout(900_000);
  const errors = collectErrors(page);
  await seedProfile(page, ['level-1', 'level-2']);
  await startFromTitle(page, '&speed=10', 'Gentle');
  await playToResults(page, 860_000);
  await expect(page.getByRole('heading', { name: 'LEVEL 3 COMPLETE' })).toBeVisible();
  await expect(page.getByText('Your whole adventure')).toBeVisible();
  expect(errors).toEqual([]);
});
