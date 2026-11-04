#!/usr/bin/env bash
# CI parity — runs EXACTLY what .github/workflows/ci.yml gates, locally, before you push.
# Green here == green in CI (Flywheel Standard §11 rule 10). Assumes `npm ci` was run.
set -euo pipefail
cd "$(dirname "$0")/.."

npm run typecheck
npm test
npm run build
if [ -n "${VITE_SUPABASE_URL:-}" ] || [ -f .env.local ]; then
  node scripts/check-analytics.mjs dist # flywheel:analytics-guard (main only in CI; here whenever the env exists)
fi
npx playwright test

echo "PASS:ci-local — safe to push"
