
// One-off script (not a "real" test) that logs in once per role and saves
// the resulting cookies + localStorage to disk. Other spec files can then
// load that saved state instead of clicking through login every time.
//
// Run it on its own with:
//   npx playwright test auth-setup --project=chromium
//
// That writes playwright/.auth/reader.json and playwright/.auth/creator.json.
// Those files are already gitignored — never commit them, session tokens live inside.

import { test } from '@playwright/test';
import fs from 'fs';
import { LoginPage } from './pages/LoginPage';
import { ReaderDashboard } from './pages/ReaderDashboard';
import { CreatorDashboard } from './pages/CreatorDashboard';



const URL = 'https://talk-and-cook-recipes.lovable.app/';

// Firefox's cookie manager rejects non-integer `expires` values
// (Protocol error NS_ERROR_ILLEGAL_VALUE) — Chromium captures them
// as floats, so round before saving. See microsoft/playwright#24221.
async function saveSanitizedState(page: import('@playwright/test').Page, path: string) {
  const state = await page.context().storageState();
  state.cookies = state.cookies.map(c => ({ ...c, expires: Math.floor(c.expires) }));
  fs.writeFileSync(path, JSON.stringify(state, null, 2));
}

test('capture reader storage state', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const readerDashboard = new ReaderDashboard(page);

  await loginPage.goto(URL);
  await loginPage.closeBanner();
  await loginPage.loginAsReader();
  await readerDashboard.assertDashboardLoaded(); //wait for login to finish

  await saveSanitizedState(page, 'playwright/.auth/reader.json');
});

test('capture creator storage state', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const creatorDashboard = new CreatorDashboard(page);
  
  await loginPage.goto(URL);
  await loginPage.closeBanner();
  await loginPage.loginAsCreator();
  await creatorDashboard.assertDashboardLoaded();

  await saveSanitizedState(page, 'playwright/.auth/creator.json');
});
