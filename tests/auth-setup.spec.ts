
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
import { LoginPage } from './pages/LoginPage';
import { ReaderDashboard } from './pages/ReaderDashboard';
import { CreatorDashboard } from './pages/CreatorDashboard';



const URL = 'https://talk-and-cook-recipes.lovable.app/';

test('capture reader storage state', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const readerDashboard = new ReaderDashboard(page);

  await loginPage.goto(URL);
  await loginPage.closeBanner();
  await loginPage.loginAsReader();
  await readerDashboard.assertDashboardLoaded(); //wait for login to finish

  await page.context().storageState({ path: 'playwright/.auth/reader.json' });
});

test('capture creator storage state', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const creatorDashboard = new CreatorDashboard(page);
  
  await loginPage.goto(URL);
  await loginPage.closeBanner();
  await loginPage.loginAsCreator();
  await creatorDashboard.assertDashboardLoaded();

  await page.context().storageState({ path: 'playwright/.auth/creator.json' });
});
