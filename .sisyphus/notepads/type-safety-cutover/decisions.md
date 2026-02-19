# Decisions

Append-only.

## 2026-02-18
- Scope: remove all TypeScript type assertions within `src/**` (`expr as T` and `<T>expr`) as part of the cutover.
- Policy: `as const` is allowed but should be treated as last resort; assertion gate should track/report it but not fail builds on it.
- Verification: assertion gate must be AST-based (TypeScript compiler API), not grep/regex.
