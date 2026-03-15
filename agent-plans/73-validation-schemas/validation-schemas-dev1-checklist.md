# Dev 1 Checklist - Zod Schema Standardization

## Shared / Contract

- [ ] Create `src/shared/kernel/validation-database.ts`.
- [ ] Create `src/shared/kernel/schemas.ts` with shared primitives + `modifySchema`.
- [ ] Add shared helpers for optional empty strings, coordinate parsing, and format checks.

## Server / Backend

- [ ] Migrate all module DTOs to shared primitives.
- [ ] Replace inline router schemas with DTOs where possible.
- [ ] Update `.email()/.url()/.uuid()/.datetime()` to Zod v4 `.check(...)` form.

## Client / Frontend

- [ ] Migrate feature schemas to use DTO-derived `modifySchema` overrides.
- [ ] Replace inline form schemas in pages/components.
- [ ] Validate UI error messages are friendly and consistent.

## QA

- [ ] Run `pnpm lint`.
- [ ] Run `TZ=UTC pnpm build`.
