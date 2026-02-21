#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

failures=0

print_header() {
  echo
  echo "== $1 =="
}

check_empty() {
  local title="$1"
  local cmd="$2"

  print_header "$title"
  local output
  output="$(eval "$cmd" || true)"

  if [[ -n "$output" ]]; then
    echo "$output"
    failures=$((failures + 1))
  else
    echo "OK"
  fi
}

check_empty \
  "No direct .trpc.* usage outside transport/provider wiring" \
  "rg -n '\\.trpc\\.' src -g '!src/trpc/**' -g '!src/common/providers/**'"

check_empty \
  "No hidden bracket invalidation calls anywhere in client layers" \
  "rg -n -F '[\"invalidate\"](' src/features src/components src/app"

check_empty \
  "Feature APIs must not import trpc react client directly" \
  "rg -n 'from \"@/trpc/client\"|from '\''@/trpc/client'\''' src/features/*/api.ts"

check_empty \
  "Feature APIs must not expose useUtils/useQueries surface" \
  "rg -n 'useUtils|useQueries' src/features/*/api.ts"

check_empty \
  "No direct sonner imports outside toast adapter + toaster UI" \
  "rg -n 'from \"sonner\"|from '\''sonner'\''' src -g '!src/common/toast/adapters/**' -g '!src/components/ui/sonner.tsx'"

check_empty \
  "No invalidate calls in feature components/pages" \
  "rg -n '\\.invalidate\\(' src/features/*/components src/features/*/pages"

check_empty \
  "No direct trpc.useUtils in feature/app composition layers" \
  "rg -n 'trpc\\.useUtils\\(' src/features src/app -g '**/components/**' -g '**/pages/**' -g '**/page.tsx' -g '**/layout.tsx'"

check_empty \
  "No non-route modules under src/app" \
  "find src/app -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.mdx' \\) | rg -v '/(page|layout|loading|error|not-found|route|template|default|icon|apple-icon|opengraph-image|twitter-image|sitemap|robots)\\.(ts|tsx|mdx)$'"

check_empty \
  "Hooks must not call transport hook namespaces directly" \
  "rg -n '\\.[A-Za-z0-9_]+\\.use(Query|Mutation)\\(' . -g 'src/features/*/hooks.ts' -g 'src/features/*/hooks/**/*.ts'"

check_empty \
  "Feature APIs must not expose unknown input/output contracts or legacy pass-through proxies" \
  "rg -n 'createTrpcFeatureApi|extends TrpcFeatureApi|declare readonly .*: unknown;|input\\?: unknown|Promise<unknown>' src/features/*/api.ts"

check_empty \
  "Feature hooks must not use namespace .query() calls" \
  "rg -n '\\.[A-Za-z0-9_]+\\.query\\(' . -g 'src/features/*/hooks.ts' -g 'src/features/*/hooks/**/*.ts'"

check_empty \
  "Feature hooks must not use namespace .mutation() calls" \
  "rg -n '\\.[A-Za-z0-9_]+\\.mutation\\(' . -g 'src/features/*/hooks.ts' -g 'src/features/*/hooks/**/*.ts'"

check_empty \
  "Feature hooks must not use namespace .query/.mutation alias exports" \
  "rg -n '\\.[A-Za-z0-9_]+\\.(query|mutation)\\b' . -g 'src/features/*/hooks.ts' -g 'src/features/*/hooks/**/*.ts'"

check_empty \
  "Feature hooks must not use namespace .queries() calls" \
  "rg -n '\\b[A-Za-z0-9_]+\\.queries\\(' . -g 'src/features/*/hooks.ts' -g 'src/features/*/hooks/**/*.ts'"

check_empty \
  "Route pages/layouts must not call createServerCaller directly" \
  "rg -n 'createServerCaller' src/app -g '**/page.tsx' -g '**/layout.tsx'"

check_empty \
  "Route pages/layouts should compose feature boundaries only (no direct shared component imports)" \
  "rg -n 'from \"@/components/' src/app -g '**/page.tsx' -g '**/layout.tsx'"

check_empty \
  "No useUtils escape hatch exports in feature hooks" \
  "rg -n 'export const useMod[A-Za-z0-9_]*Utils\\s*=\\s*.*useUtils' . -g 'src/features/*/hooks.ts' -g 'src/features/*/hooks/**/*.ts'"

check_empty \
  "No cache escape hatch exports in feature hooks" \
  "rg -n 'export (const|function) useMod[A-Za-z0-9_]*(Cache|Utils)\\b' . -g 'src/features/*/hooks.ts' -g 'src/features/*/hooks/**/*.ts'"

check_empty \
  "Feature APIs must not use createFeatureBindings transitional helper" \
  "rg -n 'createFeatureBindings|FeatureBindingsDeps|createTrpcFeatureApi|TrpcFeatureApi' src/features/*/api.ts"

check_empty \
  "No server-only files under feature modules" \
  "find src/features -type f -path '*/server/*'"

check_empty \
  "Route pages must not call publicCaller transport directly" \
  "rg -n 'publicCaller\\.' src/app -g '**/page.tsx'"

check_empty \
  "Hook export names follow useQuery/useMut/useMod (feature hook layers)" \
  "rg -n 'export (function|const) use[A-Z][A-Za-z0-9_]+' . -g 'src/features/*/hooks.ts' -g 'src/features/*/hooks/**/*.ts' | rg -v 'export (function|const) use(Query|Mut|Mod)'"

if [[ "$failures" -gt 0 ]]; then
  echo
  echo "Client conformance check failed with ${failures} violation group(s)."
  exit 1
fi

echo

echo "Client conformance check passed."
