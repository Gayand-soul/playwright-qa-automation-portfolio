import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';


export class CreatorDashboard extends BasePage {

    constructor(page: Page){
        super(page);
    }

    async assertDashboardLoaded(){
        await expect(this.page.getByRole('heading', { level:1 })).toHaveText('Min blogg');
    }

    async waitForRecipesLoaded() {
        await this.page.locator('article').first().waitFor({ state: 'visible' });
    }

    // --- Scoped to disposable "Enkelt recept" test recipes only ---
    // Safe to delete; never touches "Stekt Bacon", "Krämig svamprisotto", etc.

    enkeltReceptCards() {
        return this.page.locator('article').filter({
            has: this.page.getByRole('heading', { name: 'Enkelt recept', level: 3 })
        });
    }

    async enkeltReceptCount() {
        return this.enkeltReceptCards().count();
    }

    async deleteEnkeltRecept(index: number, confirm: boolean) {
        const card = this.enkeltReceptCards().nth(index);
        this.page.once('dialog', async (dialog) => {
            confirm ? await dialog.accept() : await dialog.dismiss();
        });
        await card.getByRole('button', { name: 'Radera recept' }).click();
    }

    async assertEnkeltReceptCount(expected: number) {
        await expect(this.enkeltReceptCards()).toHaveCount(expected);
    }

}