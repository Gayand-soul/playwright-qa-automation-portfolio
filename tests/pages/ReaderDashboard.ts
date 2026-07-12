
import { Page, expect } from '@playwright/test';
import { BasePage }from './BasePage';


export class ReaderDashboard extends BasePage {

    constructor(page: Page){
        super(page);
    }

    async assertDashboardLoaded(){
        await expect(this.page.getByRole('heading', { level:1 })).toHaveText('Mina sparade recept');
        
    }


}