# OpenAPI Migration (Mobile v1) - Overview

This task set migrates required tRPC capabilities to REST endpoints documented via OpenAPI for Expo (iOS/Android) consumption.

## Goals

- Keep the web app intact (tRPC remains the primary transport for web).
- Add a mobile-only REST surface area under `/api/mobile/v1/**`.
- Keep Zod as the canonical contract source.
- Generate OpenAPI from Zod-first contracts (no hand-written JSON schema drift).

## Auth (Mobile)

- Mobile app uses Supabase on-device auth.
- Each request to mobile REST endpoints sends:
  - `Authorization: Bearer <supabase_access_token>`
- Server validates the token with Supabase and enriches role from `user_roles`.

## Response envelope

- Success (2xx): `{ "data": T }`
- Error (non-2xx): `{ "code": string, "message": string, "requestId": string, "details"?: object }`

## API base + versioning

- Base path: `/api/mobile/v1`
- OpenAPI spec: `/api/mobile/v1/openapi.json`

## Implementation boundaries

- Route Handlers: `src/app/api/mobile/v1/**/route.ts`
- Domain logic stays in `src/lib/modules/**` services/use-cases.
- Route handlers only: parse/validate -> call service/use-case -> map to envelope.
