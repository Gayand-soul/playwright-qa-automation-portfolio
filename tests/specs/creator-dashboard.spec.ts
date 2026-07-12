
import { test } from '@playwright/test';
import { CreatorDashboard } from '../pages/CreatorDashboard';

test.use({ storageState: 'playwright/.auth/creator.json'});

test('creator dashboard loads without logging in again', async ({ page })=> {
    const creatorDashboard = new CreatorDashboard(page);

    await page.goto('https://talk-and-cook-recipes.lovable.app/dashboard');
    await creatorDashboard.assertDashboardLoaded();
})