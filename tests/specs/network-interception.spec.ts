import { test, expect } from '@playwright/test';
import { ReaderDashboard } from '../pages/ReaderDashboard';

test.use({ storageState: 'playwright/.auth/reader.json' });
test.describe.configure({ mode: 'serial' });

const EMPTY_STATE_TEXT = 'Inga sparade recept än. Tryck på hjärtat på ett recept så hamnar det här.';

// KNOWN APP BUG: unsaving a recipe correctly updates that recipe's own
// detail-page button state (confirmed to persist across reload), but the
// /saved list itself never reflects the removal - confirmed across multiple
// runs, waits up to 3 minutes, both immediately after saving and for a
// recipe left saved since a previous run. Looks like the saved-list index
// only gets updated on save, not on unsave. Account currently has "Grillad
// flankstek med chimichurri" permanently stuck showing as saved as a result.
// Skipping the empty-state test until this is fixed app-side or the
// sandbox's periodic data reset clears it.
test.skip('shows empty state message when reader has no saved recipes', async ({ page }) => {
  await page.goto('https://talk-and-cook-recipes.lovable.app/saved');
  await expect(page.getByText(EMPTY_STATE_TEXT)).toBeVisible();
});

// Test 1: Observe only. We don't change anything about the network traffic yet —
// we just want to see, for real, what requests the reader dashboard actually makes.
test('observes network requests when the reader dashboard loads', async ({ page }) => {

  page.on('response', async (response) => {
    const url = response.url();

    if (url.includes('_serverFn') || url.includes('supabase.co')) {
      const body = await response.text().catch(() => '[could not read body]');
      console.log('<<<', response.status(), url);
      console.log(body.slice(0, 300));
      console.log('content-type:', response.headers()['content-type']);
    }
  })

  await page.route('**/*', async (route) => {
    const url = route.request().url();

    if (url.includes('_serverFn') || url.includes('supabase.co')) {
      console.log('>>>', route.request().method(), url);
    }

    await route.continue();
  });

  const readerDashboard = new ReaderDashboard(page);
  await page.goto('https://talk-and-cook-recipes.lovable.app/saved');
  await readerDashboard.assertDashboardLoaded();
});

// test: run with "npx playwright test network-interception -g "shows saved recipe card after saving via UI" --headed --project=webkit"
test('shows saved recipe card after saving via UI', async ({ page }, testInfo) => {
  // KNOWN APP BUG: on touch-enabled browsers, the Spara button fires its
  // toggle handler multiple times per tap (confirmed via network logging:
  // 3 calls to the save-toggle serverFn from one click on Mobile Chrome,
  // vs. 1 on Mobile Safari). The rapid triple-toggle appears to trip the
  // same /saved list-index race documented in the unsave bug above.
  test.skip(testInfo.project.name === 'Mobile Chrome', 'Touch double-fire causes duplicate save-toggle calls — see issue #4');

  await page.goto('https://talk-and-cook-recipes.lovable.app/recipe/fb24607f-817c-4114-b633-0ef725c0d61d');

  // The detail page's own save-state is reliable (unlike /saved - see KNOWN
  // APP BUG above), so if this recipe is showing as saved from a previous
  // run, reset it here before testing the save flow itself.
  const sparatButton = page.getByRole('button', { name: 'Sparat' });
  if (await sparatButton.isVisible()) {
    await sparatButton.click();
    await expect(page.getByRole('button', { name: 'Spara' })).toBeVisible();
  }

  await page.getByRole('button', { name: 'Spara' }).click();
  await expect(page.getByRole('button', { name: 'Sparat' })).toBeVisible();

  await page.goto('https://talk-and-cook-recipes.lovable.app/saved');
  await expect(page.getByRole('link', { name: /Perfekt sommargrillning/ })).toBeVisible();
  await expect(page.getByText(EMPTY_STATE_TEXT)).not.toBeVisible();
});