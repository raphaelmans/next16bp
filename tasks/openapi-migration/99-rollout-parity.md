# Rollout + Parity

## Coexistence

- Web continues to use tRPC under `/api/trpc/**`.
- Mobile uses REST under `/api/mobile/v1/**`.

## Parity testing

If a capability is exposed in both transports:

- Validate the same Zod schema.
- Ensure equivalent auth + rate limiting boundaries.
- Ensure error semantics match (domain code + HTTP status).

## Deprecation

- Only after mobile endpoints are stable and adopted:
  - optionally migrate web to REST
  - deprecate specific tRPC procedures
