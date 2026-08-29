import { test } from '@playwright/test';
import { CreatorDashboard } from '../pages/CreatorDashboard';

test.use({ storageState: 'playwright/.auth/creator.json' });

test.describe('Min blogg — delete recipe (scoped to "Enkelt recept" only)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://talk-and-cook-recipes.lovable.app/dashboard');
    const creatorDashboard = new CreatorDashboard(page);
    await creatorDashboard.assertDashboardLoaded();
    await creatorDashboard.waitForRecipesLoaded();
  });

  test('TC-XX: delete triggers a native confirm() dialog with correct copy', async ({ page }) => {
    const creatorDashboard = new CreatorDashboard(page);
    const countBefore = await creatorDashboard.enkeltReceptCount();
    test.skip(countBefore === 0, 'No "Enkelt recept" test recipes left.');

    let message = '';
    page.once('dialog', async (dialog) => {
      message = dialog.message();
      await dialog.dismiss();
    });
    await creatorDashboard.enkeltReceptCards().first().getByRole('button', { name: 'Radera recept' }).click();

    if (!message.includes('Det går inte att ångra')) {
      throw new Error(`Unexpected dialog copy: "${message}"`);
    }
  });

  test('TC-XX: cancelling the confirm dialog keeps the recipe', async ({ page }) => {
    const creatorDashboard = new CreatorDashboard(page);
    const countBefore = await creatorDashboard.enkeltReceptCount();
    test.skip(countBefore === 0, 'No "Enkelt recept" test recipes left.');

    await creatorDashboard.deleteEnkeltRecept(0, false);
    await creatorDashboard.assertEnkeltReceptCount(countBefore);
  });

  test('TC-XX: confirming the dialog removes only that recipe', async ({ page }) => {
    const creatorDashboard = new CreatorDashboard(page);
    const countBefore = await creatorDashboard.enkeltReceptCount();
    test.skip(countBefore === 0, 'No "Enkelt recept" test recipes left — recreate some before running this test.');

    await creatorDashboard.deleteEnkeltRecept(0, true);
    await creatorDashboard.assertEnkeltReceptCount(countBefore - 1);
  });
});