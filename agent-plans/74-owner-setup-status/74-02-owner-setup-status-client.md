# Phase 2: Client Adoption

## Scope

Adopt the centralized owner setup status in the setup hub and owner dashboard.

## Shared / Contract

- [ ] Confirm `OwnerSetupStatus` response fields used in UI.

## Server / Backend

- [ ] N/A (no changes in this phase).

## Client / Frontend

- [ ] Add `useOwnerSetupStatus` hook to consume `ownerSetup.getStatus`.
- [ ] Update `/owner/get-started` to use `useOwnerSetupStatus` instead of multiple queries.
- [ ] Ensure claim submission and org creation invalidate `ownerSetup.getStatus`.
- [ ] Add a dashboard CTA card in `/owner` when `isSetupComplete` is false.
- [ ] Display next-step helper copy based on `nextStep` (non-blocking, optional).

## Testing

- [ ] Setup hub renders consistent step completion states.
- [ ] Dashboard CTA appears for incomplete setup and hides when complete.
