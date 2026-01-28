# Owner Setup Status - Client Dev1 Checklist

## Shared / Contract

- [ ] Ensure UI reads from `OwnerSetupStatus` only.

## Server / Backend

- [ ] N/A (no changes in this checklist).

## Client / Frontend

- [ ] Add `useOwnerSetupStatus` hook and export it.
- [ ] Refactor `/owner/get-started` to use centralized status.
- [ ] Invalidate `ownerSetup.getStatus` on org creation and claim submit.
- [ ] Add dashboard CTA for incomplete setup.
