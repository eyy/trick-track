import { type Page, expect } from '@playwright/test';

/**
 * Open the app on a clean IndexedDB. Playwright isolates storage per context,
 * but IndexedDB can survive reloads within a worker, so we delete the DB
 * explicitly before the app boots and again after, then reload so the app
 * reads from the now-empty store.
 */
export async function gotoClean(page: Page): Promise<void> {
  // First navigation: get a document so we can touch indexedDB on this origin.
  await page.goto('/');
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('event-tracker');
        req.onsuccess = req.onerror = req.onblocked = () => resolve();
      }),
  );
  // Reload so the Dexie connection reopens against the fresh DB.
  await page.reload();
  // Wait until the app has loaded its (empty) state.
  await expect(page.getByRole('heading', { name: 'trick-track' })).toBeVisible();
}

/** Fill the add-event form fields. `when` is a datetime-local value or omitted. */
export async function fillForm(
  page: Page,
  { category, note, when }: { category: string; note?: string; when?: string },
): Promise<void> {
  const form = page.locator('form.form');
  await form.getByPlaceholder('Category').fill(category);
  if (note !== undefined) await form.getByPlaceholder('What happened?').fill(note);
  if (when !== undefined) await form.locator('input[type="datetime-local"]').fill(when);
}

/** Add an event via the top form. */
export async function addEvent(
  page: Page,
  opts: { category: string; note?: string; when?: string },
): Promise<void> {
  const before = await page.locator('li.event').count();
  await fillForm(page, opts);
  await page.getByRole('button', { name: 'Add event' }).click();
  // The note field resets to empty after a successful submit; also wait for a
  // new row to appear so we don't race the async refresh().
  await expect(page.locator('li.event')).toHaveCount(before + 1);
}

/** A datetime-local string for `date` at local time, e.g. "2026-06-29T14:05". */
export function localDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The list item rows, in DOM order (newest-first as rendered). */
export function eventRows(page: Page) {
  return page.locator('li.event');
}

/** Day-group headings in DOM order. */
export function dayLabels(page: Page) {
  return page.locator('section.day h2.day-label');
}
