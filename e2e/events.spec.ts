import { test, expect } from '@playwright/test';
import { addEvent, dayLabels, eventRows, gotoClean, localDateTime } from './helpers';

test.beforeEach(async ({ page }) => {
  await gotoClean(page);
});

// 1. Add an event.
test('adds an event and shows it in the list', async ({ page }) => {
  await addEvent(page, { category: 'Coffee', note: 'flat white' });

  const row = eventRows(page).first();
  await expect(row.locator('.category')).toHaveText('Coffee');
  await expect(row.locator('.text')).toHaveText('flat white');
  // A time label like "14:05" is rendered.
  await expect(row.locator('.time')).toHaveText(/\d{1,2}[:.]\d{2}/);
  // Each row carries a per-category color dot.
  await expect(row.locator('.dot')).toHaveCount(1);
  // Default-now event lands under Today.
  await expect(dayLabels(page).first()).toHaveText('Today');
});

// 2. Category pick-or-new.
test('offers a used category as a datalist suggestion and accepts a new one', async ({
  page,
}) => {
  await addEvent(page, { category: 'Work', note: 'standup' });

  // "Work" is now offered in the category pick-or-new datalist.
  await expect(page.locator('#category-options option[value="Work"]')).toHaveCount(1);

  // A brand-new category is accepted.
  await addEvent(page, { category: 'Errand', note: 'post office' });
  await expect(eventRows(page).first().locator('.category')).toHaveText('Errand');
  await expect(page.locator('#category-options option[value="Errand"]')).toHaveCount(1);
});

// 3. Default-now timestamp -> Today.
test('a new event without touching When is grouped under Today', async ({ page }) => {
  await addEvent(page, { category: 'Note' });
  await expect(dayLabels(page)).toHaveText(['Today']);
});

// 4. Editable timestamp -> past day.
test('setting When to yesterday groups the event under Yesterday', async ({ page }) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(10, 0, 0, 0);

  await addEvent(page, { category: 'Gym', note: 'leg day', when: localDateTime(yesterday) });

  await expect(dayLabels(page).first()).toHaveText('Yesterday');
  await expect(dayLabels(page).filter({ hasText: 'Today' })).toHaveCount(0);
});

// 5. Newest-first, grouped by day.
test('renders day groups newest-first and events newest-first within a day', async ({
  page,
}) => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const earlierToday = new Date(today);
  earlierToday.setHours(8, 0, 0, 0);
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(9, 0, 0, 0);

  // Add out of order on purpose.
  await addEvent(page, { category: 'Old', note: 'older', when: localDateTime(twoDaysAgo) });
  await addEvent(page, { category: 'A', note: 'early today', when: localDateTime(earlierToday) });
  await addEvent(page, { category: 'B', note: 'noon today', when: localDateTime(today) });

  // First group is Today; the two-days-ago group comes after.
  const labels = dayLabels(page);
  await expect(labels.first()).toHaveText('Today');
  await expect(await labels.count()).toBe(2);

  // Within Today, noon (B) is above early (A).
  const todayRows = page.locator('section.day').first().locator('li.event .category');
  await expect(todayRows).toHaveText(['B', 'A']);

  // The last group holds the oldest event.
  await expect(
    page.locator('section.day').last().locator('li.event .category'),
  ).toHaveText(['Old']);
});

// 6. Duplicate.
test('duplicating copies category + note but stamps it now', async ({ page }) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(9, 0, 0, 0);

  await addEvent(page, { category: 'Med', note: 'vitamin D', when: localDateTime(yesterday) });
  await expect(dayLabels(page)).toHaveText(['Yesterday']);

  await eventRows(page).first().getByRole('button', { name: 'Duplicate' }).click();
  await expect(eventRows(page)).toHaveCount(2);

  // New duplicate is under Today, original stays under Yesterday.
  await expect(dayLabels(page).first()).toHaveText('Today');
  const dup = page.locator('section.day').first().locator('li.event').first();
  await expect(dup.locator('.category')).toHaveText('Med');
  await expect(dup.locator('.text')).toHaveText('vitamin D');
  // Original still present under Yesterday.
  await expect(dayLabels(page).nth(1)).toHaveText('Yesterday');
});

// 7. Edit (Save persists, Cancel discards).
test('editing an event: Save persists, Cancel discards', async ({ page }) => {
  await addEvent(page, { category: 'Work', note: 'draft' });

  // Cancel discards.
  const row = eventRows(page).first();
  await row.getByRole('button', { name: 'Edit' }).click();
  const editForm = row.locator('.edit');
  await editForm.getByPlaceholder('What happened?').fill('CHANGED-but-cancelled');
  await editForm.getByRole('button', { name: 'Cancel' }).click();
  await expect(row.locator('.text')).toHaveText('draft');

  // Save persists category + note change.
  await row.getByRole('button', { name: 'Edit' }).click();
  await editForm.getByPlaceholder('Category').fill('Personal');
  await editForm.getByPlaceholder('What happened?').fill('final note');
  await editForm.getByRole('button', { name: 'Save' }).click();

  const after = eventRows(page).first();
  await expect(after.locator('.category')).toHaveText('Personal');
  await expect(after.locator('.text')).toHaveText('final note');
});

// 8. Delete is immediate with an undo snackbar.
test('delete removes immediately and offers Undo to restore', async ({ page }) => {
  await addEvent(page, { category: 'Temp', note: 'to delete' });

  // Delete removes the event right away (no confirm step) and shows a snackbar.
  await eventRows(page).first().getByRole('button', { name: 'Delete' }).click();
  await expect(eventRows(page)).toHaveCount(0);
  const snackbar = page.locator('div.snackbar[role="status"]');
  await expect(snackbar).toContainText('Deleted');

  // Undo restores the event (same category + note).
  await snackbar.getByRole('button', { name: 'Undo' }).click();
  await expect(eventRows(page)).toHaveCount(1);
  const restored = eventRows(page).first();
  await expect(restored.locator('.category')).toHaveText('Temp');
  await expect(restored.locator('.text')).toHaveText('to delete');
});

test('delete without undo leaves the event gone', async ({ page }) => {
  await addEvent(page, { category: 'Gone', note: 'bye' });

  await eventRows(page).first().getByRole('button', { name: 'Delete' }).click();
  await expect(eventRows(page)).toHaveCount(0);
  await expect(page.getByText('No events yet.')).toBeVisible();

  // It's deleted from the DB immediately regardless of the snackbar — a reload
  // (which re-reads IndexedDB) confirms it did not come back.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'trick-track' })).toBeVisible();
  await expect(eventRows(page)).toHaveCount(0);
});

test('deleting several within the window batches into one Undo that restores all', async ({
  page,
}) => {
  await addEvent(page, { category: 'Batch', note: 'one' });
  await addEvent(page, { category: 'Batch', note: 'two' });
  await expect(eventRows(page)).toHaveCount(2);

  // Delete both rows (each Delete removes immediately and accumulates the batch).
  await eventRows(page).first().getByRole('button', { name: 'Delete' }).click();
  await expect(eventRows(page)).toHaveCount(1);
  await eventRows(page).first().getByRole('button', { name: 'Delete' }).click();
  await expect(eventRows(page)).toHaveCount(0);

  // A single snackbar reads "Deleted 2" with exactly one Undo button.
  const snackbar = page.locator('div.snackbar[role="status"]');
  await expect(snackbar).toContainText('Deleted 2');
  await expect(snackbar.getByRole('button', { name: 'Undo' })).toHaveCount(1);

  // One Undo restores the whole batch (both notes back, order-agnostic since the
  // two share a minute-precision timestamp).
  await snackbar.getByRole('button', { name: 'Undo' }).click();
  await expect(eventRows(page)).toHaveCount(2);
  await expect(page.getByText('one')).toBeVisible();
  await expect(page.getByText('two')).toBeVisible();
});

// 9. Free-text note suggestions: a note used >= 3 times in a category becomes a chip.
test('a note used 3x in a category surfaces a tap-to-fill suggestion chip', async ({
  page,
}) => {
  const form = page.locator('form.form');
  const chip = form.getByRole('button', { name: 'Standup' });

  // Two occurrences in "Work" — not enough to trigger a suggestion yet.
  await addEvent(page, { category: 'Work', note: 'Standup' });
  await addEvent(page, { category: 'Work', note: 'Standup' });

  // Selecting "Work" with only 2 prior occurrences shows no chip.
  await form.getByPlaceholder('Category').fill('Work');
  await expect(chip).toHaveCount(0);

  // A third occurrence crosses the minCount=3 threshold.
  await addEvent(page, { category: 'Work', note: 'Standup' });

  // Re-select "Work" (toggle away first so the effect re-runs) → the chip appears.
  await form.getByPlaceholder('Category').fill('Other');
  await expect(chip).toHaveCount(0);
  await form.getByPlaceholder('Category').fill('Work');
  await expect(chip).toBeVisible();

  // Tapping the chip fills the Note textarea.
  await form.getByPlaceholder('What happened?').fill('');
  await chip.click();
  await expect(form.getByPlaceholder('What happened?')).toHaveValue('Standup');
});

// 9b. Quick-log: tap a top-category button to log it instantly with an empty note.
test('quick-log button logs a new event in that category with no note', async ({ page }) => {
  // Make "Work" a recent top category.
  await addEvent(page, { category: 'Work', note: 'a' });
  await addEvent(page, { category: 'Work', note: 'b' });
  await expect(eventRows(page)).toHaveCount(2);

  // A quick-log button named "Work" appears (its accessible name is the category text).
  const quickWork = page.locator('.quicklog button', { hasText: 'Work' });
  await expect(quickWork).toBeVisible();

  // Tapping it logs a new Work event, now, with an empty note → +1 row under Today.
  await quickWork.click();
  await expect(eventRows(page)).toHaveCount(3);

  const newest = page.locator('section.day').first().locator('li.event').first();
  await expect(dayLabels(page).first()).toHaveText('Today');
  await expect(newest.locator('.category')).toHaveText('Work');
  await expect(newest.locator('.text')).toHaveCount(0); // no note text rendered
});

// 10. Export / import round-trip + idempotent merge.
test('export then import (replace) restores; merge import is idempotent', async ({
  page,
}, testInfo) => {
  await addEvent(page, { category: 'Work', note: 'one' });
  await addEvent(page, { category: 'Home', note: 'two' });
  await expect(eventRows(page)).toHaveCount(2);

  // Export -> capture the downloaded file.
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  const filePath = testInfo.outputPath('export.json');
  await download.saveAs(filePath);

  // Wipe to an empty DB.
  await gotoClean(page);
  await expect(page.getByText('No events yet.')).toBeVisible();

  // Import in REPLACE mode restores the two events.
  await page.getByLabel('Replace existing').check();
  await page.locator('label.import input[type="file"]').setInputFiles(filePath);
  await expect(page.locator('.status')).toContainText('Imported 2 events.');
  await expect(eventRows(page)).toHaveCount(2);

  // Import the SAME file again in MERGE mode -> no duplicates (idempotent).
  await page.getByLabel('Replace existing').uncheck();
  await page.locator('label.import input[type="file"]').setInputFiles(filePath);
  await expect(page.locator('.status')).toContainText('Imported 0 events.');
  await expect(eventRows(page)).toHaveCount(2);
});

// 11. Persistence across reload.
test('events persist across a reload', async ({ page }) => {
  await addEvent(page, { category: 'Persist', note: 'stay here' });
  await addEvent(page, { category: 'Persist', note: 'me too' });
  await expect(eventRows(page)).toHaveCount(2);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'trick-track' })).toBeVisible();
  await expect(eventRows(page)).toHaveCount(2);
  await expect(eventRows(page).first().locator('.text')).toHaveText('me too');
});

// Isolation sanity: a fresh test must not see the prior test's events.
test('isolation: starts from a clean DB', async ({ page }) => {
  await expect(page.getByText('No events yet.')).toBeVisible();
  await expect(eventRows(page)).toHaveCount(0);
  await addEvent(page, { category: 'Solo' });
  await expect(eventRows(page)).toHaveCount(1);
});
