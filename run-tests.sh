#!/bin/sh

npx playwright test --grep-invert "shows saved recipe card after saving via UI"
STABLE_EXIT=$?

PLAYWRIGHT_HTML_REPORT=playwright-report-flaky npx playwright test --grep "shows saved recipe card after saving via UI"

exit $STABLE_EXIT