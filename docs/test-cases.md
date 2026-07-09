# Manual Test Cases — CookingPage Sandbox

Scope matches `test-plan.md`: login, banner dismissal, and dashboard load verification for Reader and Creator roles, across Chromium, Firefox, and WebKit.

| ID | Title | Steps | Expected Result | Priority |
|---|---|---|---|---|
| TC-01 | Reader login — happy path | 1. Navigate to the site.<br>2. Dismiss the announcement banner if present.<br>3. Select "Reader reader@sandbox.test ·".<br>4. Wait for navigation. | User lands on the Reader dashboard, and the page displays the heading "Mina sparade recept". | High |
| TC-02 | Creator login — happy path | 1. Navigate to the site.<br>2. Dismiss the announcement banner if present.<br>3. Select "Creator creator@sandbox.test".<br>4. Wait for navigation. | User lands on the Creator dashboard, and the page displays the heading "Min blogg". | High |
| TC-03 | Announcement banner dismissal (Chromium/Firefox) | 1. Navigate to the site.<br>2. Locate the banner close button.<br>3. Click it. | Banner becomes hidden; no elements remain visually blocked. | High |
| TC-04 | Announcement banner dismissal (WebKit) | 1. Navigate to the site in WebKit.<br>2. Wait for the close button to be visible.<br>3. Click it.<br>4. Wait for the banner to be hidden before proceeding. | Banner closes without intercepting subsequent pointer events; login can proceed immediately after. | High |
| TC-05 | Reader dashboard heading verification | 1. Complete Reader login.<br>2. Inspect the page for an `h1`. | The `h1` text is exactly "Mina sparade recept". | Medium |
| TC-06 | Creator dashboard heading verification | 1. Complete Creator login.<br>2. Inspect the page for an `h1`. | The `h1` text is exactly "Min blogg". | Medium |
| TC-07 | Reader vs. Creator selector text is not ambiguous | 1. On the login screen, inspect both role selector buttons. | Reader button text ends in a trailing "·" character; Creator button text does not. A selector for one role must not accidentally match the other. | Medium |
| TC-08 | Cross-browser regression — Reader flow | 1. Run TC-01 on Chromium.<br>2. Run TC-01 on Firefox.<br>3. Run TC-01 on WebKit. | Identical pass result and dashboard state across all three engines. | High |
| TC-09 | Cross-browser regression — Creator flow | 1. Run TC-02 on Chromium.<br>2. Run TC-02 on Firefox.<br>3. Run TC-02 on WebKit. | Identical pass result and dashboard state across all three engines. | High |
| TC-10 | Parallel execution does not cause cross-test interference | 1. Run the full suite with `fullyParallel: true`.<br>2. Observe all specs/browsers running concurrently. | Reader and Creator tests do not affect each other's session/state; all tests pass independently. | Medium |
| TC-11 (edge case) | Login attempt before banner is dismissed | 1. Navigate to the site.<br>2. Without dismissing the banner, attempt to click the Reader or Creator selector. | Click is blocked or intercepted by the banner (documents current behavior); confirms why `closeBanner()` must run first in every flow. | Low |
| TC-12 (edge case) | Reload after login | 1. Complete Reader (or Creator) login.<br>2. Reload the page. | Document actual behavior: whether the session persists and the dashboard reloads correctly, or whether the user is returned to the login/selector screen. | Low |

## Notes

- TC-11 and TC-12 are edge cases intended to confirm real behavior rather than assert a specific "correct" outcome — record what actually happens and file a bug only if it contradicts expected UX.
- Cases beyond login/dashboard (recipe search, viewing a recipe, Creator publishing actions) are intentionally excluded — see "Out of scope" in `test-plan.md`. Add rows here once those features are explored in a later phase.
