import { test, expect } from '@playwright/test';
import fs from 'fs';

test.use({ storageState: 'playwright/.auth/reader.json' });

const RECIPE_ID = 'fb24607f-817c-4114-b633-0ef725c0d61d';
const ITERATIONS = 10;

test('diagnostic: repeated Spara/Sparat toggles to catch intermittent multi-fire', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch,
    'This diagnostic only makes sense on a touch-enabled project (Mobile Chrome / Mobile Safari).');

  test.setTimeout(90_000);

  const networkLog: { iter: number; tMs: number; method: string; url: string }[] = [];
  const t0 = Date.now();
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/auth/v1/')) return;
    if (url.includes('_serverFn') || url.includes('supabase.co')) {
      networkLog.push({ iter: (page as any)._iter ?? -1, tMs: Date.now() - t0, method: req.method(), url });
    }
  });

  await page.goto(`https://talk-and-cook-recipes.lovable.app/recipe/${RECIPE_ID}`);

  const sparatButton = page.getByRole('button', { name: 'Sparat' });
  if (await sparatButton.isVisible().catch(() => false)) {
    await sparatButton.click();
    await expect(page.getByRole('button', { name: 'Spara' })).toBeVisible();
  }

  // Re-render-proof: instead of anchoring to one stale element handle,
  // check by button label each time, since the element may get replaced
  // on every toggle re-render.
  await page.evaluate(() => {
    (window as any).__evLog = [];
    (window as any).__iter = 0;
    const types = ['touchstart', 'touchend', 'touchcancel', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click'];
    for (const type of types) {
      document.addEventListener(type, (e: Event) => {
        const target = e.target as HTMLElement;
        const btn = target.closest('button');
        const label = btn?.textContent?.trim();
        if (label === 'Spara' || label === 'Sparat') {
          (window as any).__evLog.push({
            iter: (window as any).__iter,
            type: e.type,
            isTrusted: (e as any).isTrusted,
            t: e.timeStamp,
            label,
          });
        }
      }, { capture: true });
    }
  });

  for (let i = 0; i < ITERATIONS; i++) {
    await page.evaluate((n) => { (window as any).__iter = n; }, i);
    (page as any)._iter = i;

    const spara = page.getByRole('button', { name: 'Spara' });
    const sparat = page.getByRole('button', { name: 'Sparat' });
    if (await spara.isVisible().catch(() => false)) {
      await spara.click();
    } else {
      await sparat.click();
    }
    await page.waitForTimeout(1500); // let network settle before the next toggle
  }

  const evLog = await page.evaluate(() => (window as any).__evLog);

  const byIter: Record<number, { domEvents: any[]; networkCalls: any[] }> = {};
  for (let i = 0; i < ITERATIONS; i++) byIter[i] = { domEvents: [], networkCalls: [] };
  for (const e of evLog) { if (byIter[e.iter]) byIter[e.iter].domEvents.push(e); }
  for (const n of networkLog) { if (byIter[n.iter]) byIter[n.iter].networkCalls.push(n); }

  const summary = Object.entries(byIter).map(([iter, data]) => ({
    iter: Number(iter),
    trustedClicks: data.domEvents.filter((e: any) => e.type === 'click' && e.isTrusted).length,
    totalNetworkCalls: data.networkCalls.length,
    postCalls: data.networkCalls.filter((n: any) => n.method === 'POST').length,
  }));

  const report = { byIter, summary };
  fs.writeFileSync('issue-18-diagnostic.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(summary, null, 2));
});