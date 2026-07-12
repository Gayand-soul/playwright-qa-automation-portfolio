
import { test, expect } from '@playwright/test';
import fs from 'fs';



const SUPABASE_URL = 'https://fejqqtatmdvqefwizhlx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7WL4nUO6L6HqGQThFKm3Lw_Vrui6PQv';

function getAccessToken(storageStatePath: string): string {
    const state = JSON.parse(fs.readFileSync(storageStatePath, 'utf-8'));
    const origin = state.origins.find((o: any) => o.origin.includes('lovable.app'));
    const entry = origin.localStorage.find(
        (item: any) => item.name.startsWith('sb-') && item.name.endsWith('-auth-token')
    );
    return JSON.parse(entry.value).access_token;
}

test('reads data as an authenticated reader via Supabase REST', async ({ request }) => {
    const token = getAccessToken('playwright/.auth/reader.json');

    const response = await request.get(`${SUPABASE_URL}/rest/v1/blogs?select=id,title`, {
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
        },
    });

    expect(response.status()).toBe(200);
    console.log(await response.json());
});