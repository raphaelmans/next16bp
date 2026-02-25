# Drizzle-First Data Access Contract

## Core Rule

For application data in PostgreSQL, use Drizzle as the primary interface.

## Must

- Use Drizzle schema definitions in `src/lib/shared/infra/db/schema/*`.
- Use `drizzle-kit` for schema migration lifecycle (`db:generate`, `db:migrate`, `db:push`, `db:studio`).
- Use repository/service layers with `DbClient` for runtime reads/writes.
- Use `TransactionManager` for multi-write workflows.
- Keep data scripts on Drizzle where practical (query builder or `sql` tag through Drizzle execution).

## Must Not

- Do not use Supabase data APIs (`from`, `rpc`, REST) for application business tables.
- Do not add route/service code that bypasses repositories to call raw provider-specific DB APIs.
- Do not make Supabase the source of schema truth through ad hoc dashboard edits.

## Allowed Exceptions

- Provider features that are not generic SQL data access (for example Supabase Auth and Supabase Storage).
- Explicitly documented operational scripts that target provider-managed schemas.

## Exception Policy

Every exception must include:

- Why Drizzle is insufficient for the specific operation.
- Why provider-specific behavior is required.
- A migration note describing how to replace it if provider changes.
