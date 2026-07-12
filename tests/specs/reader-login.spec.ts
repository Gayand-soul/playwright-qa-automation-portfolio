
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ReaderDashboard } from '../pages/ReaderDashboard';

const URL = 'https://talk-and-cook-recipes.lovable.app/';

test('Reader can log in successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const readerDashboard = new ReaderDashboard(page);

  await loginPage.goto(URL);
  await loginPage.closeBanner();
  await loginPage.loginAsReader();
  await readerDashboard.assertDashboardLoaded();
  console.log('URL after login:', page.url());

});