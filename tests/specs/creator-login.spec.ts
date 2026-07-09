
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CreatorDashboard } from '../pages/CreatorDashboard';



const URL = 'https://talk-and-cook-recipes.lovable.app/';

test('Creator can log in and see dashboard', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const creatorDashboard = new CreatorDashboard(page);

  await loginPage.goto(URL);
  await loginPage.closeBanner();
  await loginPage.loginAsCreator();
  await creatorDashboard.assertDashboardLoaded();
});