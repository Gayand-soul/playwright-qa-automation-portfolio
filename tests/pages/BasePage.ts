
//This handles one shared responsibility: closing the banner "SKicka ett meddelande" .

import { Page } from '@playwright/test';

export class BasePage {
    readonly page: Page;

    constructor(page: Page){
        this.page = page;
    }

    async closeBanner(){
        const banner = this.page.locator('div.fixed.z-\\[60\\]');
        await banner.waitFor({ state: 'visible'});
        await banner.locator('button').last().click();
        await banner.waitFor({ state:'hidden'});
    }

}

