# Playwright: Session Summary — Jul 30, 2026

## What happened this session

Picked up mid-remediation from the Jul 27 security incident (Supabase `access_token`/`refresh_token` for `reader@sandbox.test` leaked via `saved-diagnostic.json` in commit `089089b`). Worked through the remaining steps, in order:

1. **Confirmed credential rotation.** Friend confirmed `reader@sandbox.test` was deleted and recreated with a new user ID, invalidating the leaked token/session (login still works via `Sandbox123!`). Decoded the actual leaked JWT from GitGuardian's occurrence view to double-check scope: ES256, issued 7/27/2026 12:42:42 PM, expired 1:42:42 PM (1hr TTL — natural expiry, not revocation), subject email `reader@sandbox.test`, session_id `ad664347-f626-4d45-b8ea-ca04de544299`. Only one token showed up in the incident — confirmed `creator@sandbox.test` was never actually part of this leak (it had only been offered as a precautionary option, not something that needed separate rotation).

2. **Purged `saved-diagnostic.json` from git history.** Installed `git-filter-repo` (`py -m pip install git-filter-repo`; needed to add its Scripts dir to PATH manually since it wasn't added automatically). Ran `git filter-repo --path saved-diagnostic.json --invert-paths --force`, re-added the `origin` remote (filter-repo strips it), force-pushed `--all` and `--tags`. Verified with `git log --all --full-history -- saved-diagnostic.json` — empty, confirmed purged.
   - **Gotcha hit twice:** the `.gitignore` entry for `saved-diagnostic.json` had literal double-quotes and a stray Windows `\r` baked into the line (`"saved-diagnostic.json" ` instead of `saved-diagnostic.json`), so the pattern never actually matched — `git check-ignore` returned not-ignored both times we checked. Fixed once, but the `filter-repo` checkout silently reverted the uncommitted fix; had to redo it and commit explicitly (`git add tests/specs/network-interception.spec.ts .gitignore` — never `git add .` while this file sits untracked, to avoid restaging it).

3. **Audited old CI logs for the same leak.** Checked every workflow run that executed the vulnerable diagnostic test before it was patched — runs #24 through #28 on `Gayand-soul/playwright-qa-automation-portfolio`. Pulled each job's full raw log (via the "View raw logs" link, which yields a temporary Azure blob URL with the complete plain-text log — much more reliable than GitHub's virtualized in-page log viewer/search, which doesn't actually search collapsed/unloaded sections). Searched for `access_token`, `refresh_token`, `bearer`, and `/auth/v1/` traffic in each. **Result: clean across all five runs** — the only `/auth/v1/` calls logged were `GET /auth/v1/user` (returns profile data, not tokens), and the only "token" hit anywhere was GitHub's own redacted `token: ***` from the checkout step. No log needed deletion.

4. **Patched the diagnostic test to prevent recurrence.** Added `if (url.includes('/auth/v1/')) return;` as the first line inside both `page.on('response', ...)` handlers in `tests/specs/network-interception.spec.ts` (the `diagnostic: inspect /saved responses across reload race` test and the `observes network requests when the reader dashboard loads` test) — auth token responses are now skipped before anything gets logged or written to disk. Committed as `4511943`, pushed to `main`.

5. **Marked the GitGuardian incident Resolved.** Status → Resolved, reason "Secret revoked." ~2 days 6 hours from detection to close.

6. **Verified Phase 4 CI/CD end-to-end.**
   - Confirmed both GitHub Pages report URLs (`.../stable/index.html`, `.../flaky/index.html`) render real data, not blank shells — each response contains an embedded base64 zip payload with actual test-result JSON, confirming the Playwright HTML reporter's data actually deployed (not just the page shell).
   - Manually triggered `docker-build-test` via `workflow_dispatch` (Actions tab → Run workflow → `main`). **First attempt failed** after 44s with exit code 126 (permission denied).
   - **Root cause:** a `Dockerfile` ordering bug. The original file did `COPY run-tests.sh ./` → `chmod +x run-tests.sh` → then `COPY . .`, and that final `COPY . .` re-copied the whole build context — including `run-tests.sh` again — silently overwriting the chmod'd, CRLF-fixed version with the original non-executable one from the host. Fixed by moving `COPY . .` *before* the `sed`/`chmod` step, so the fix-up applies to the file that actually ends up in the image. Committed as `79762b1`, pushed.
   - This push (touching `Dockerfile`) auto-triggered `docker-build-test` via `paths-filter` — passed. Also manually re-ran via `workflow_dispatch` (run #32) as a second confirmation — full pipeline green (`changes`, `test`, `docker-build-test` in 3m52s, `publish-report`).

**Tooling note:** Claude in Chrome was intermittently disconnected for parts of this session. Fallback that worked well: GitHub's workflow-run pages render job status and *annotation text* (including exit codes and warning summaries) even when logged out via a plain HTTP fetch — enough to diagnose the Dockerfile failure without needing full log access.

## What's left, in order

1. **Issue #18** (Mobile Chrome save-toggle double-fire) — deferred again this session in favor of the security cleanup and Phase 4. Confirmed reproducible on demand (unlike #16), so likely a quicker root-cause investigation whenever picked back up. See https://github.com/Gayand-soul/playwright-qa-automation-portfolio/issues/18

2. **Issue #16 root cause** (`/saved` list staleness race) — still open. The reload-retry workaround is in place and reduces how often it's hit, but the underlying race is unconfirmed. Would need either the full 5-project CI concurrency caught in the act with the existing diagnostic instrumentation attached, or backend/infra access (Supabase logs, response headers) that neither of us has directly.

3. **Out of scope for now**, per `test-plan.md`: recipe search/filtering, and edit/delete on an existing blog post — candidates whenever you want to expand coverage beyond the current test plan.

Nothing else outstanding from the Jul 27 security incident — rotation, purge, log audit, recurrence-prevention patch, and GitGuardian resolution are all closed out, and Phase 4 CI/CD (Docker build + published HTML reports) is fully verified working end-to-end.
