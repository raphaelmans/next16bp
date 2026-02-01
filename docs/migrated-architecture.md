# Migrated Architecture (Before / After)

This document captures the folder layout before and after the server-lib + client-conventions migrations.

## Before
```text
src/
  app/                      # Next.js App Router routes
  features/                 # Feature-specific UI + logic
  components/               # Shared UI (partial)
  shared/                   # Mixed server + client code
    components/             # Shared UI (legacy)
    infra/                  # Server infra
    kernel/                 # Shared schemas/helpers (mixed)
    lib/                    # Shared helpers (mixed)
    utils/                  # Shared utilities (mixed)
  modules/                  # Server-only modules (routers/services/repos)
  trpc/                     # tRPC client
```

## After
```text
src/
  app/                      # Next.js App Router routes
  features/                 # Feature-specific UI + logic
    <feature>/
      helpers.ts            # Feature helpers (client-safe)
      hooks.ts              # Feature hooks
      schemas.ts            # Feature schemas
  components/               # Shared UI (kudos/layout/ui)
  common/                   # Client-safe shared utilities
    clients/                # Shared client API wrappers
    hooks/                  # Shared client hooks
    providers/              # App providers
    utils/                  # Small shared utilities
    app-routes.ts
    booking-window.ts
    format.ts
    payment-methods.ts
    ph-location-data.ts
    redirects.ts
    schemas.ts
    section-hashes.ts
    time-zone.ts
    validation-database.ts
  lib/                      # Server-only code
    shared/                 # Server infra + kernel + server libs
    modules/                # Server modules (routers/services/repos)
  trpc/                     # tRPC client
```

## Key Rules
- `src/lib` is server-only (no browser APIs, no client hooks).
- `src/common` contains shared, client-safe helpers and schemas.
- Feature logic lives in `src/features/<feature>` with `helpers.ts`, `hooks.ts`, `schemas.ts`.
- Shared UI lives in `src/components` (not `src/shared/components`).
