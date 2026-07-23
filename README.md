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
  pages/
    BasePage.ts
    LoginPage.ts
    ReaderDashboard.ts
    CreatorDashboard.ts
  specs/
    reader-login.spec.ts
    creator-login.spec.ts
    reader-dashboard.spec.ts       # reuses saved reader storage state, skips UI login
    creator-dashboard.spec.ts      # reuses saved creator storage state, skips UI login
    api-practice.spec.ts           # CRUD + chaining practice against dummyjson.com
    supabase-api.spec.ts           # real Supabase REST calls using the extracted session token
    network-interception.spec.ts  # request/response logging, data-driven save-toggle flow,
                                   # reload-retry against a known app race (see Issue #16)

                                  # Mobile Chrome save-toggle double-fire tracked separately ([#18])

tsconfig.json
playwright.config.ts
```

## Roadmap

- [x] **Phase 1 — Foundations:** Login flows for reader and creator roles, passing on all three browser
- [x] **Phase 2 — Page Object Model:** Refactor tests into POM classes (`BasePage`, `LoginPage`, `ReaderDashboard`, `CreatorDashboard`)
- [x] **Phase 3 — Intermediate & API testing:** Test plan and manual test cases documented (`docs/`); API request testing, auth state reuse (storage state + Supabase REST), network interception, and data-driven tests (parameterized save-toggle flow) all complete
- [x] **Phase 2 — Page Object Model:** Refactor tests into POM classes (`ReaderDashboard.ts`, `CreatorDashboard.ts` in progress)
- [ ] **Phase 3 — Intermediate & API testing:** API request testing and auth state reuse (storage state + Supabase REST) complete; network interception and data-driven tests next
- [ ] **Phase 4 — CI/CD:** GitHub Actions pipeline, Docker, published HTML test reports

Active investigation: [Issue #16](https://github.com/Gayand-soul/playwright-qa-automation-portfolio/issues/16) — a `/saved` list caching race (mitigated test-side with a reload-retry) and a separate touch double-fire bug on Mobile Chrome.

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

## Bug Reporting

Bugs found during testing are filed as GitHub Issues, with Playwright trace files and screenshots attached for reproducibility.

## Author

Gaya Andersson
