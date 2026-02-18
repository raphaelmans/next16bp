# Owner Setup Status

## Endpoint

- `GET /api/mobile/v1/owner/setup/status`
  - Auth: Bearer token required
  - Maps: `trpc.ownerSetup.getStatus`

## Notes

- This is the hub read model that tells the app what is missing:
  - org
  - venue
  - verification/reservationsEnabled
  - courts
  - hours/pricing
  - payment methods (for paid venues)

## Implementation

- Route handler calls the existing use-case:
  - `src/lib/modules/owner-setup/use-cases/get-owner-setup-status.use-case.ts`
