import { test, expect } from '@playwright/test';
import fs from 'fs';
import { ReaderDashboard } from '../pages/ReaderDashboard';

test.use({ storageState: 'playwright/.auth/reader.json' });
test.describe.configure({ mode: 'serial' });

//Diagnostic test 1 (date= 27 July 2026, v2: logs method, wider body slice, UI checks)
test('diagnostic: inspect /saved responses across reload race', async ({ page }) => {
  test.setTimeout(60_000);
  const recipeId = 'fb24607f-817c-4114-b633-0ef725c0d61d';
  const recipeTitle = 'Grillad flankstek med chimichurri';
  const log: any[] = [];

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/auth/v1/')) return; // never log auth token responses (contain access/refresh tokens)
    if (url.includes('_serverFn') || url.includes('supabase.co')) {
      log.push({
        phase: (page as any)._diagPhase ?? 'unlabeled',
        method: response.request().method(),
        status: response.status(),
        url,
        headers: response.headers(),
        body: (await response.text().catch(() => '[unreadable]')).slice(0, 3000),
      });
    }
  });

  await page.goto(`https://talk-and-cook-recipes.lovable.app/recipe/${recipeId}`);
  const sparatButton = page.getByRole('button', { name: 'Sparat' });
  if (await sparatButton.isVisible()) {
    await sparatButton.click();
    await expect(page.getByRole('button', { name: 'Spara' })).toBeVisible();
  }

  (page as any)._diagPhase = 'after-save';
  await page.getByRole('button', { name: 'Spara' }).click();
  await expect(page.getByRole('button', { name: 'Sparat' })).toBeVisible();

  (page as any)._diagPhase = 'first-load-of-saved';
  await page.goto('https://talk-and-cook-recipes.lovable.app/saved');
  await page.waitForTimeout(1500);

  const savedRecipesSection = page.locator('h1:has-text("Mina sparade recept") + *');
  const savedLinkFirstLoad = savedRecipesSection.getByRole('link', { name: new RegExp(recipeTitle) });
  const visibleOnFirstLoad = await savedLinkFirstLoad.isVisible().catch(() => false);
  log.push({ phase: 'first-load-of-saved', uiCheck: true, recipeVisible: visibleOnFirstLoad });

  (page as any)._diagPhase = 'after-reload';
  await page.reload();
  await page.waitForTimeout(1500);

  const savedLinkAfterReload = savedRecipesSection.getByRole('link', { name: new RegExp(recipeTitle) });
  const visibleAfterReload = await savedLinkAfterReload.isVisible().catch(() => false);
  log.push({ phase: 'after-reload', uiCheck: true, recipeVisible: visibleAfterReload });

  fs.writeFileSync('saved-diagnostic.json', JSON.stringify(log, null, 2));
  console.log(JSON.stringify(log, null, 2));
  console.log(`UI CHECK — visible on first load: ${visibleOnFirstLoad}, visible after reload: ${visibleAfterReload}`);
});



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

    if (url.includes('/auth/v1/')) return; // never log auth token responses (contain access/refresh tokens)

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
type TestRecipe = {
  id: string;
  title: string;
};

const testRecipes: TestRecipe[] = [
  { id: 'fb24607f-817c-4114-b633-0ef725c0d61d', title: 'Grillad flankstek med chimichurri' },
  { id: '70a9fa91-67c5-4d3d-a757-c1a09c1e74ae', title: 'Ugnsbakad lax med citronpotatis' },
  { id: 'f96f114c-2f8e-48db-aec1-0edf491ea6e7', title: 'Krämig svamppasta med timjan' },
];

for (const recipe of testRecipes) {
  test(`shows saved recipe card after saving via UI (${recipe.title})`, async ({ page }, testInfo) => {
    // KNOWN APP BUG: on touch-enabled browsers, the Spara button fires its
    // toggle handler multiple times per tap (confirmed via network logging:
    // 3 calls to the save-toggle serverFn from one click on Mobile Chrome,
    // vs. 1 on Mobile Safari). Reproduced again after adding the /saved
    // reload-retry below, and it fails earlier than that fix even applies -
    // right at the local "Sparat" button check on the detail page - so this
    // is confirmed independent of the /saved list bug, not fixed by it.
    test.skip(testInfo.project.name === 'Mobile Chrome',
      'Tapping Spara fires the save-toggle serverFn multiple times on Mobile Chrome, and the net ' +
      'toggle state is unreliable as a result (confirmed separately from the /saved list bug below). ' +
      'See https://github.com/Gayand-soul/playwright-qa-automation-portfolio/issues/18'
    );

    // Previously also skipped here for this recipe on Chromium specifically
    // (list never picked up the new save). Manual investigation (Issue #16)
    // found the /saved list can serve a stale snapshot on first load after a
    // save; the reload-retry loop below reloads instead of just waiting, and
    // fixed every isolated single-project run (chromium: 3/3 recipes passed).
    // NOTE: running the full 5-project suite against this same shared reader
    // account still occasionally reproduces the underlying race on chromium
    // and firefox (different recipe each time, not a fixed combo) - the
    // retry clearly reduces how often this bug is hit, but doesn't eliminate
    // it when several browser sessions hit the same account back-to-back.
    // Not re-skipping: this now looks like account contention exposing a
    // still-real server-side race, not something a longer client-side wait
    // can fully paper over.
    //
    // CI EVIDENCE (first GitHub Actions run): even with workers=1 forcing the
    // whole suite serial, this still hit 1 failed + 3 flaky across chromium
    // and firefox. CI runners are slower and farther from the live Lovable/
    // Supabase backend than a local machine, so the reload-retry window that
    // passed 3/3 locally isn't always enough once that extra latency is
    // added. Widening the window (and the test timeout that has to contain
    // it) rather than treating it as a CI-only quirk.
    test.setTimeout(60_000);

    await page.goto(`https://talk-and-cook-recipes.lovable.app/recipe/${recipe.id}`);

    // The detail page's own save-state is reliable (unlike /saved - see below),
    // so if this recipe is showing as saved from a previous run, reset it here
    // before testing the save flow itself.
    const sparatButton = page.getByRole('button', { name: 'Sparat' });
    if (await sparatButton.isVisible()) {
      await sparatButton.click();
      await expect(page.getByRole('button', { name: 'Spara' })).toBeVisible();
    }

    await page.getByRole('button', { name: 'Spara' }).click();
    await expect(page.getByRole('button', { name: 'Sparat' })).toBeVisible();

    await page.goto('https://talk-and-cook-recipes.lovable.app/saved');

    // KNOWN APP BUG (Issue #16): the /saved list can render a snapshot taken
    // before this save, even on a fresh page.goto - confirmed via manual
    // cross-browser testing that a reload (not just waiting) is what surfaces
    // the new entry. So we poll by reloading rather than trusting the first
    // load, instead of just extending the timeout on a single assertion.
    const savedRecipesSection = page.locator('h1:has-text("Mina sparade recept") + *');
    const savedLink = savedRecipesSection.getByRole('link', { name: new RegExp(recipe.title) });

    await expect(async () => {
      if (!(await savedLink.isVisible())) {
        await page.reload();
      }
      await expect(savedLink).toBeVisible();
    }).toPass({ timeout: 30_000 });

    await expect(page.getByText(EMPTY_STATE_TEXT)).not.toBeVisible();
  });
}