//this class handles: everything related to login form.


import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {

    constructor(page: Page){
        super(page);
    }

    async goto(url: string){
        await this.page.goto(url);
    }

    async loginAsReader() {
    await this.page.getByRole('link', { name: 'Logga in' }).click();
    await this.page.getByRole('button', { name: 'Reader reader@sandbox.test ·' }).click();
    await this.page.getByRole('button', { name: 'Logga in' }).click();
  }

  async loginAsCreator() {
    await this.page.getByRole('link', { name: 'Logga in' }).click();
    await this.page.getByRole('button', { name: 'Creator creator@sandbox.test' }).click();
    await this.page.getByRole('button', { name: 'Logga in' }).click();
  }

}