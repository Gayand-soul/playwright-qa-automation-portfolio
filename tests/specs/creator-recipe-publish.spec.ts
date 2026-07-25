import { test, expect } from '@playwright/test';
import path from 'path';

test.use({
  storageState: 'playwright/.auth/creator.json',
});

/**
 * KNOWN BUG — GitHub Issue #20
 * https://github.com/Gayand-soul/playwright-qa-automation-portfolio/issues/20
 *
 * The real bug: publishing a voice-recorded recipe can fail because the app
 * computes `cooking_time_minutes` as a float (e.g. 30.075) instead of a whole
 * number, and Postgres rejects it for an `integer` column with error 22P02.
 *
 * This test does NOT rely on reproducing that exact computation through a
 * real voice recording. Playwright's fake microphone (needed to unblock the
 * recording UI in automated Chromium) feeds silence, which produces a
 * generic, empty recipe that actually saves successfully (confirmed: an
 * automated run returned 201, not the bug). Instead, this test mocks the
 * recipe-save API response to force the known 22P02 error, and asserts that
 * the frontend correctly surfaces it as "Kunde inte spara receptet". That's
 * the behavior we actually want to lock in as a regression guard while
 * Issue #20 is open.
 *
 * When Issue #20 is fixed: this test can stay as-is — it documents correct
 * frontend error-handling regardless of root cause, so no changes are
 * needed unless the error message or handling itself changes.
 */
test('shows an error banner when the recipe save API returns the known 22P02 error — issue #20', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Voice recording needs a fake mic device; only configured for the chromium project.');

  // Force the exact failure captured in Issue #20, regardless of the actual
  // (fake-audio-generated) recipe content sent in the real request.
  page.on('request', (req) => {
  if (req.url().includes('recipes')) console.log('REQUEST:', req.method(), req.url());
    });
  await page.route(/\/rest\/v1\/recipes(\?.*)?$/, async (route)  => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        code: '22P02',
        details: null,
        hint: null,
        message: 'invalid input syntax for type integer: "30.075"',
      }),
    });
  });

  await page.goto('https://talk-and-cook-recipes.lovable.app/dashboard');

  await page.getByRole('link', { name: '🎙️ Spela in recept' }).click();
  await page.getByText('Snabbt (< 30 min)').click();
  await page.getByRole('button', { name: 'Börja spela in' }).click();
  await page.getByRole('button', { name: 'Stoppa & skapa recept' }).click();

  await page.getByText('Ta eller välj ett kort').click();
  await page.getByLabel('📸Ta eller välj ett kort').setInputFiles(path.join(__dirname, '..', 'fixtures', 'stekt-bacon1.jpg'));
  await page.getByRole('button', { name: 'Publicera till bloggen' }).click();

  await expect(page.getByText('Kunde inte spara receptet')).toBeVisible();
});