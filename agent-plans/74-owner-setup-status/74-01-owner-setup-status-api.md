# Phase 1: Owner Setup Status API

## Scope

Create a centralized backend use-case and tRPC endpoint that returns owner setup status for any authenticated user.

## Shared / Contract

- [ ] Endpoint: `ownerSetup.getStatus`
- [ ] Auth: `protectedProcedure`
- [ ] Input: none
- [ ] Output: `OwnerSetupStatus`

```ts
type OwnerSetupNextStep =
  | "create_organization"
  | "add_or_claim_venue"
  | "claim_pending"
  | "verify_venue"
  | "configure_courts"
  | "complete";

type OwnerSetupStatus = {
  hasOrganization: boolean;
  organization: { id: string; name: string } | null;
  hasPendingClaim: boolean;
  hasVenue: boolean;
  primaryPlace: { id: string; name: string } | null;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | null;
  hasVerification: boolean;
  hasActiveCourt: boolean;
  isSetupComplete: boolean;
  nextStep: OwnerSetupNextStep;
};
```

## Server / Backend

- [ ] Create module `src/modules/owner-setup/`.
- [ ] Add use-case `get-owner-setup-status.use-case.ts` that:
  - [ ] Finds organizations by owner.
  - [ ] Finds places (with verification) for the primary org.
  - [ ] Picks the most recent place as primary.
  - [ ] Checks for active courts on the primary place.
  - [ ] Checks for pending claim requests for the user.
  - [ ] Computes `hasVerification`, `isSetupComplete`, and `nextStep`.
- [ ] Add `owner-setup.router.ts` with `ownerSetup.getStatus`.
- [ ] Wire router into `src/shared/infra/trpc/root.ts`.

## Client / Frontend

- [ ] N/A (no changes in this phase).

## Testing

- [ ] Verify endpoint returns expected booleans for:
  - [ ] no org
  - [ ] org only
  - [ ] org + venue
  - [ ] org + venue + verification
  - [ ] org + venue + verification + active court
