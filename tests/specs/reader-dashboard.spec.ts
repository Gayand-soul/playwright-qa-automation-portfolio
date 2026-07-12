
import { test } from '@playwright/test';
import { ReaderDashboard } from '../pages/ReaderDashboard';

// This is the payoff: loading a saved storage state means the browser
// context starts already logged in. Notice there's no LoginPage import
// being used to click through login here at all.
test.use({ storageState: 'playwright/.auth/reader.json' });

test('reader dashboard loads without logging in again', async ({ page }) => {
  const readerDashboard = new ReaderDashboard(page);

  await page.goto('https://talk-and-cook-recipes.lovable.app/saved');
  await readerDashboard.assertDashboardLoaded();
});
