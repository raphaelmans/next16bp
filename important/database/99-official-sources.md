# Official Sources

## How These Sources Were Collected

- Context7 MCP (library docs lookup and extraction)
- Web search (Google Search MCP) to validate/find official pages
- Direct fetch of official documentation pages

Reviewed on: 2026-02-23

Web search validation queries:

- "Drizzle ORM official docs drizzle-kit push generate migrate"
- "Supabase auth managing user data auth.users primary key references"
- "Supabase managed schemas auth storage schema drift"

## Drizzle (Official)

- `drizzle-kit generate`
  - https://orm.drizzle.team/docs/drizzle-kit-generate
  - Key point: generates SQL migration artifacts from schema diffs.
- `drizzle-kit migrate`
  - https://orm.drizzle.team/docs/drizzle-kit-migrate
  - Key point: applies unapplied migrations and records applied history in migration log table.
- `drizzle-kit push`
  - https://orm.drizzle.team/docs/drizzle-kit-push
  - Key point: directly diffs + applies schema changes, without generating migration SQL files.

## Supabase (Official)

- Auth user management
  - https://supabase.com/docs/guides/auth/managing-user-data
  - Key points:
    - Auth schema is not exposed in auto-generated API.
    - Prefer app-owned public tables referencing `auth.users` with `on delete cascade`.
    - Use primary key references for managed tables like `auth.users`.
- Managed schema drift guidance (Prisma troubleshooting page, but platform guidance is relevant)
  - https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting
  - Key point: managed schemas like `auth` and `storage` may change; direct migration coupling can cause drift.
- Storage bucket creation
  - https://supabase.com/docs/guides/storage/buckets/creating-buckets
  - https://supabase.com/docs/guides/storage/quickstart
  - Key point: buckets can be managed via dashboard, SQL, or SDK.

## Scope Note

This sources file supports architecture and policy decisions in `important/database/*`.
Project-specific rules in `AGENTS.md` still take precedence over generic tool capabilities.
