# Test Plan — CookingPage Sandbox (Playwright Automation Project)

## 1. Introduction

This document describes the test plan for a Swedish-language cooking/recipe web application, tested in a sandbox environment (hosted on Lovable). The project pairs manual test design with Playwright (TypeScript) automation, following a Page Object Model (POM) architecture, and targets Chromium, Firefox, and WebKit.

## 2. Objectives

- Verify that both user roles (Reader and Creator) can log in and reach their correct dashboard.
- Verify that the announcement banner can be dismissed without blocking other interactions.
- Establish a regression suite that runs reliably across all three browser engines.
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

### Out of scope (current phase — candidates for later phases)

- Recipe search and filtering
- Viewing/opening an individual recipe
- Creator-specific actions (publishing, editing, deleting a blog post)
- Authenticated API/network-level testing
- Data-driven or fixture-based tests
- CI/CD pipeline behavior (covered under Phase 4, not by this plan)
- Payment, account creation, or any real credential/production flow (this is a sandbox with fixed test accounts only)

## 4. Test Approach

A hybrid approach is used:

- **Manual exploratory testing** to establish expected behavior and edge cases before automating (see `test-cases.md`).
- **Automated regression testing** with Playwright, using POM classes (`BasePage`, `LoginPage`, `ReaderDashboard`, `CreatorDashboard`) to keep locators out of spec files.
- Automation prioritizes the highest-value flow first — login plus dashboard verification — before expanding to secondary features.

## 5. Test Environment

| Item | Detail |
|---|---|
| Application | Cooking/recipe sandbox site (Swedish UI), hosted on Lovable |
| Test accounts | `reader@sandbox.test`, `creator@sandbox.test` (pre-filled selector, no typed credentials) |
| Automation tool | Playwright with TypeScript |
| Browsers | Chromium, Firefox, WebKit |
| Execution mode | Fully parallel (`fullyParallel: true`) |
| Project structure | `tests/pages/` (POM classes), `tests/specs/` (spec files) |

## 6. Risk Areas

- **WebKit banner interception**: the announcement banner (`div.fixed.z-[60]`) can intercept pointer events in WebKit specifically; the close action must be explicitly waited on (`visible` before click, `hidden` after) to avoid flaky failures.
- **Role-based selector text mismatch**: the Reader button label includes a trailing "·" character that the Creator label does not — a naive selector match risks silently matching the wrong role.
- **Login mechanism assumption**: the flow uses a pre-filled account selector rather than typed credentials; any test or reviewer assuming standard username/password entry will misread the flow.
- **Cross-browser timing differences**: parallelized runs across three engines increase the chance of timing-related flakiness versus a single-browser suite.

## 7. Entry / Exit Criteria

**Entry criteria**: POM classes implemented and reviewed; spec files refactored to use them; local run passes on all three browsers.

**Exit criteria** (for this phase): `reader-login.spec.ts` and `creator-login.spec.ts` pass consistently across Chromium, Firefox, and WebKit with no raw locators remaining in spec files.

## 8. Deliverables

- `docs/test-plan.md` (this document)
- `docs/test-cases.md` (manual test case table)
- Automated Playwright specs under `tests/specs/`
- GitHub Issues for any defects found, linked to Playwright traces/screenshots (Phase 4)
