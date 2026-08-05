# Test Plan — CookingPage Sandbox (Playwright Automation Project)

## 1. Introduction

This document describes the test plan for a Swedish-language cooking/recipe web application, tested in a sandbox environment (hosted on Lovable). The project pairs manual test design with Playwright (TypeScript) automation, following a Page Object Model (POM) architecture, and targets Chromium, Firefox, and WebKit.

## 2. Objectives

- Verify that both user roles (Reader and Creator) can log in and reach their correct dashboard.
- Verify that the announcement banner can be dismissed without blocking other interactions.
- Establish a regression suite that runs reliably across all three browser engines.
- Extend coverage to authenticated API calls and key Creator/Reader flows (recipe publishing, saving), including regression tests for bugs found via exploratory automation.
- Produce documentation (this plan, manual test cases, bug reports) that mirrors a professional QA workflow.

## 3. Scope

### In scope (current phase)

- Login flow via the pre-filled user selector for both roles: `reader@sandbox.test` and `creator@sandbox.test`
- Announcement banner dismissal (`closeBanner()`), including the WebKit pointer-interception issue
- Post-login dashboard load verification:
  - Reader → heading "Mina sparade recept"
  - Creator → heading "Min blogg"
- Cross-browser execution: Chromium, Firefox, WebKit
- Parallel test execution (`fullyParallel: true`)
- Authenticated API/network-level testing: real Supabase REST calls using extracted session tokens (`supabase-api.spec.ts`, `recipes-api.spec.ts`), plus request/response logging (`network-interception.spec.ts`)
- Data-driven and fixture-based tests: parameterized save-toggle flow across multiple recipes, image fixture (`stekt-bacon1.jpg`) used in the publish flow
- Viewing an individual recipe (`/recipe/:id`) and toggling its saved state
- Creator recipe publishing: voice-record → photo upload → publish flow, including regression coverage for a known publish-blocking bug (Issue #20)
- Site-wide recipe/creator search (search box querying `recipes` and `profiles` in parallel), including regression coverage for two bugs found via Codegen-assisted exploration: apostrophe double-escaping in the recipes filter, and the search-clear reset failure

### Out of scope (current phase — candidates for later phases)

- Editing or deleting an existing blog post (publishing itself is now in scope; edit/delete are not)


## 4. Test Approach

A hybrid approach is used:

- **Manual exploratory testing** to establish expected behavior and edge cases before automating (see `test-cases.md`).
- **Automated regression testing** with Playwright, using POM classes (`BasePage`, `LoginPage`, `ReaderDashboard`, `CreatorDashboard`) to keep locators out of spec files.
- **Codegen-assisted exploratory automation** for less-covered flows (e.g. creator voice-recipe publishing), used to surface real bugs rather than only confirm expected behavior — this is how Issue #20 was found.
- Automation prioritizes the highest-value flow first — login plus dashboard verification — before expanding to secondary features.
- Where a bug can't be reliably reproduced end-to-end through the UI (e.g. Issue #20's float-vs-integer failure depends on AI-parsed step durations, not something a scripted mic input can force), it gets a complementary API-level test that isolates the specific backend behavior instead of a flaky UI reproduction.

## 5. Test Environment

| Item | Detail |
|---|---|
| Application | Cooking/recipe sandbox site (Swedish UI), hosted on Lovable |
| Backend | Supabase (PostgREST + Auth), exercised directly in API-level tests |
| Test accounts | `reader@sandbox.test`, `creator@sandbox.test` (pre-filled selector, no typed credentials) |
| Automation tool | Playwright with TypeScript |
| Browsers | Chromium, Firefox, WebKit (API-level tests are browser-agnostic and don't require multi-browser runs) |
| Execution mode | Fully parallel (`fullyParallel: true`) |
| Project structure | `tests/pages/` (POM classes), `tests/specs/` (spec files) |

## 6. Risk Areas

- **WebKit banner interception**: the announcement banner (`div.fixed.z-[60]`) can intercept pointer events in WebKit specifically; the close action must be explicitly waited on (`visible` before click, `hidden` after) to avoid flaky failures.
- **Role-based selector text mismatch**: the Reader button label includes a trailing "·" character that the Creator label does not — a naive selector match risks silently matching the wrong role.
- **Login mechanism assumption**: the flow uses a pre-filled account selector rather than typed credentials; any test or reviewer assuming standard username/password entry will misread the flow.
- **Cross-browser timing differences**: parallelized runs across three engines increase the chance of timing-related flakiness versus a single-browser suite.
- **No real microphone in CI/automated browsers**: the creator voice-recording flow needs a fake media device, which feeds silence rather than real speech — limits how reliably voice-dependent bugs (e.g. Issue #20) can be reproduced through the UI alone.
- **Backend implementation drift**: the recipe save flow has changed shape since Issue #20 was first captured (single atomic POST → draft-then-PATCH), a reminder that API-level tests tied to a specific request shape can go stale if the backend changes.

## 7. Entry / Exit Criteria

**Entry criteria**: POM classes implemented and reviewed; spec files refactored to use them; local run passes on all three browsers.

**Exit criteria** (for this phase): `reader-login.spec.ts` and `creator-login.spec.ts` pass consistently across Chromium, Firefox, and WebKit with no raw locators remaining in spec files.

## 8. Deliverables

- `docs/test-plan.md` (this document)
- `docs/test-cases.md` (manual test case table)
- Automated Playwright specs under `tests/specs/`
- GitHub Issues for any defects found, linked to Playwright traces/screenshots/regression tests (Issues #16, #18, #20 currently open)