# Playwright QA Automation Portfolio

Automated end-to-end test suite built with **Playwright** and **TypeScript**, testing a Swedish-language cooking/recipe web app. Built as a hands-on learning project to demonstrate a complete, professional QA process — from test design through CI/CD.

Repo: [github.com/Gayand-soul/playwright-qa-automation-portfolio](https://github.com/Gayand-soul/playwright-qa-automation-portfolio)

## Overview

- **Site under test:** Swedish-language cooking/recipe sandbox (hosted on Lovable)
- **Test accounts:** `reader@sandbox.test`, `creator@sandbox.test` (pre-filled user-selector login, no manual credentials)
- **Language note:** UI and locators are in Swedish
- **Pattern:** Page Object Model (POM)
- **Browsers:** Chromium, Firefox, WebKit

## Tech Stack

- Playwright Test
- TypeScript
- Node.js v22+
- VS Code + Playwright Test for VSCode extension

## Project Structure
```
docs/
  test-plan.md              # scope, approach, environment, risk areas
  test-cases.md             # manual test case table (TC-01 ... TC-12)
tests/
  auth-setup.spec.ts        # one-off: logs in once per role, saves storage state to playwright/.auth/
  fixtures/
    stekt-bacon1.jpg          # photo used in the creator recipe-publish flow
  pages/
    BasePage.ts
    LoginPage.ts
    ReaderDashboard.ts
    CreatorDashboard.ts
  specs/
    reader-login.spec.ts
    creator-login.spec.ts
    reader-dashboard.spec.ts      # reuses saved reader storage state, skips UI login
    creator-dashboard.spec.ts     # reuses saved creator storage state, skips UI login
    api-practice.spec.ts          # CRUD + chaining practice against dummyjson.com
    supabase-api.spec.ts          # real Supabase REST calls using the extracted session token
                                  # (chromium-only — pure request-fixture test, no browser needed)
    network-interception.spec.ts  # request/response logging, data-driven save-toggle flow,
                                  # reload-retry against a known app race (see Issue #16);
                                  # includes a diagnostic test that logs full request/response
                                  # detail for the /saved list's serverFn call, used to
                                  # investigate Issue #16 without needing full CI concurrency
                                  # Mobile Chrome save-toggle double-fire tracked separately (Issue #18)
    creator-recipe-publish.spec.ts  # UI-level: asserts the frontend shows the correct error
                                  # banner when the backend returns the known 22P02 error (Issue #20)
    recipes-api.spec.ts             # API-level: POSTs directly to Supabase REST to confirm
                                  # Postgres rejects a non-integer cooking_time_minutes (Issue #20)
                                  # (chromium-only — pure request-fixture test, no browser needed)
    recipe-delete.spec.ts           # Creator "Min blogg" dashboard: delete recipe flow (native
                                  # confirm() dialog, accept/cancel), scoped to disposable
                                  # "Enkelt recept" test fixtures only

tsconfig.json
playwright.config.ts
```

## Roadmap


- [x] **Phase 1 — Foundations:** Login flows for reader and creator roles, passing on all three browser
- [x] **Phase 2 — Page Object Model:** Refactor tests into POM classes (`BasePage`, `LoginPage`, `ReaderDashboard`, `CreatorDashboard`)
- [x] **Phase 3 — Intermediate & API testing:** Test plan and manual test cases documented (`docs/`); API request testing, auth state reuse (storage state + Supabase REST), network interception, and data-driven tests (parameterized save-toggle flow) all complete
- [x] **Phase 3.5 — Bug hunting via Codegen:** Recorded the creator voice-recipe flow (voice → photo → publish) with Playwright Codegen; found a real publish-blocking bug (Issue #20, below) and added both a UI-level and an API-level regression test for it
- [x] **Phase 4 — CI/CD:** GitHub Actions pipeline runs on every push/PR to `main`; the known `/saved` race (below) is quarantined in a separate non-blocking step so it can't mask a real regression in the stable suite. Docker image builds and runs the suite in a dedicated CI job (triggered when `Dockerfile`/`run-tests.sh`/`package*.json` change, or manually via `workflow_dispatch`); stable and flaky-suite HTML reports are published to GitHub Pages after every run.

Active investigations: [Issue #16](https://github.com/Gayand-soul/playwright-qa-automation-portfolio/issues/16) — a `/saved` list staleness race. Root cause still unconfirmed: a diagnostic test in `network-interception.spec.ts` identified the actual serverFn endpoint behind the list and captured clean, consistent data under single-session load — meaning the race needs the full multi-project CI concurrency to reproduce, and doesn't show up in isolated manual runs. No caching headers (`Cache-Control`, `Age`) appear on the app's own endpoints, so a CDN/edge cache and backend read/write lag are both still on the table — [Issue #18](https://github.com/Gayand-soul/playwright-qa-automation-portfolio/issues/18) — a separate touch double-fire bug on Mobile Chrome — and [Issue #20](https://github.com/Gayand-soul/playwright-qa-automation-portfolio/issues/20) — recipe publish fails because `cooking_time_minutes` is computed as a float and sent to an `integer` Postgres column.
— and two bugs found via Codegen-assisted exploration of the search feature: [Issue #21](https://github.com/Gayand-soul/playwright-qa-automation-portfolio/issues/21) — the recipe search double-escapes apostrophes in its `ilike` filter (`\\'` instead of `\'`), so titles/descriptions legitimately containing one can never match; and [Issue #22](https://github.com/Gayand-soul/playwright-qa-automation-portfolio/issues/22) — clearing the search box fires no network request and leaves the recipe list blank instead of restoring the full list, recoverable only via a page reload.
— and one more finding from exploring the creator-facing "Min blogg" dashboard: [Issue #23](https://github.com/Gayand-soul/playwright-qa-automation-portfolio/issues/23) — there is no edit functionality anywhere in the app for an existing recipe (only publish/unpublish and delete controls exist on the dashboard, and the public recipe view has neither).

Progress is tracked on the [GitHub Project board](../../projects) and via [Issues](../../issues).

## Running the Tests

```bash
git clone https://github.com/Gayand-soul/playwright-qa-automation-portfolio.git
cd playwright-qa-automation-portfolio
npm install
npx playwright test
```

## Key Engineering Notes

- Centralizing locators/actions in POM classes reduces duplication and long-term maintenance cost
- Locator strategy favors `getByRole` — resilient to markup changes, carries accessibility signal, matches real user intent
- Known UI quirk: an announcement banner intercepts pointer events in WebKit; handled by waiting for visibility before interacting and hidden state after dismissal
- CI runs the stable suite and the known-flaky `/saved` race test separately, so a tracked app bug (Issue #16) can't mask a real regression elsewhere in the pipeline
- Running Playwright inside a GitHub Actions `container:` job breaks Firefox specifically — GitHub overrides `$HOME` to a path the container's user doesn't own, and Firefox's own sandbox check refuses to launch under that mismatch (Chromium/WebKit don't enforce this); fixed by setting `HOME: /root` at the job level.
- Storage state captured via Chromium includes a float `expires` cookie value that Firefox's Juggler protocol rejects on injection (`Protocol error (Browser.setCookies): NS_ERROR_ILLEGAL_VALUE`, a known Playwright issue — [microsoft/playwright#24221](https://github.com/microsoft/playwright/issues/24221)); fixed by rounding `expires` to an integer in `auth-setup.spec.ts` before writing the auth JSON files
- Playwright's browsers have no real microphone by default; the creator voice-recording flow needs `--use-fake-device-for-media-stream` plus `permissions: ['microphone']` (Chromium only). The fake device feeds silence, which the app turns into an empty/generic recipe that saves successfully — so it can't reliably reproduce Issue #20 end-to-end, which is why that bug gets a separate API-level test instead of relying on scripted voice input
- Two-tier regression strategy for backend-originated bugs like Issue #20: an API-level test (`recipes-api.spec.ts`) hits Supabase REST directly to lock in the schema-level behavior, while a UI-level test (`creator-recipe-publish.spec.ts`) mocks the same API response to lock in the frontend's error handling — neither alone covers both layers
- Pure API-level tests (`recipes-api.spec.ts`, `supabase-api.spec.ts`) only use the `request` fixture and never touch a browser context, so they behave identically across all 5 projects; scoped to `chromium` only via `testIgnore` in `playwright.config.ts` to avoid running the same HTTP call 5 times per suite run
- Debugging Issue #16: a click fired immediately after navigation can silently no-op if it lands before the page finishes hydrating — no error, no failed assertion, just zero network calls. Confirmed this during live reproduction attempts; any reload-retry or race-reproduction logic should assert the underlying network call actually fired before trusting a "save" as real

## Bug Reporting

Bugs found during testing are filed as GitHub Issues, with Playwright trace files and screenshots attached for reproducibility. Where a bug can't be reliably reproduced end-to-end through the UI (e.g. Issue #20), it's backed by an API-level test that isolates the specific backend behavior instead.

## Author

Gaya Andersson
