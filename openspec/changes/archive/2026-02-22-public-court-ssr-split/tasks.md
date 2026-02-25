## 1. OpenSpec and server composition scaffolding

- [x] 1.1 Add route-level ISR and switch `src/app/(public)/venues/[placeId]/page.tsx` to use server-composed rendering output.
- [x] 1.2 Refactor discovery place-detail page composition into server-first sections with preserved metadata and canonical redirect behavior.

## 2. Server data split for parallel streaming

- [x] 2.1 Add server-side section data helpers for place core, courts, and venue details.
- [x] 2.2 Create server section components for courts and venue details with independent suspense fallbacks.

## 3. Client boundary isolation

- [x] 3.1 Add a dedicated client-only dynamic availability studio entry component.
- [x] 3.2 Remove initial client place-fetch gating for primary venue content while preserving booking interaction behavior.

## 4. Validation and regression checks

- [x] 4.1 Run `pnpm lint` and fix issues introduced by the migration.
- [ ] 4.2 Validate venue route behavior for SSR content, slug redirect, dynamic availability loading, and not-found handling.
