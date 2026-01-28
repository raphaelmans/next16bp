# Owner Setup Status - Server Dev1 Checklist

## Shared / Contract

- [ ] Confirm `OwnerSetupStatus` + `OwnerSetupNextStep` types.
- [ ] Align `verificationStatus` values with place verification enums.

## Server / Backend

- [ ] Add `owner-setup` module folder and files.
- [ ] Implement `GetOwnerSetupStatusUseCase`.
- [ ] Add `ownerSetup` router with `getStatus`.
- [ ] Register router in `appRouter`.

## Client / Frontend

- [ ] N/A (no changes in this checklist).
