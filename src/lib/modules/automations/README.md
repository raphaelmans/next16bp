# Automations Architecture

> Structured server-side automation modules for repeatable operational workflows.

This folder is the server-side home for automation logic that was previously
implemented directly in `scripts/*`.

## Purpose

Automations should follow the same discipline as backend modules:

- clear responsibilities
- thin entrypoints
- reusable services
- explicit orchestration
- testable pure/shared logic

`scripts/*` remain the CLI surface, but they should be thin wrappers that call
factories and services from this folder.

## Layering

```
scripts/* entrypoints
        │
        ▼
factories/
        │
        ▼
use-cases/        services/
        │            │
        └──────┬─────┘
               ▼
        repositories/
               ▼
        file/db/external systems
```

## Current Module

- `curated-ingestion/`
  - scraping and extraction
  - duplicate preflight
  - embedding refresh
  - end-to-end ingestion orchestration

## Rules

- Business logic belongs here, not in `scripts/*`
- `scripts/*` parse args and delegate only
- Shared helpers live under `shared/`
- Pure decision logic should be unit-tested under `src/__tests__/`
