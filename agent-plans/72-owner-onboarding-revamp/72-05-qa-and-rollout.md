# Phase 6: QA + Rollout

## Shared / Contract

- [x] Confirm route set:
  - `/owners/get-started` (indexable)
  - `/list-your-venue` (permanent redirect)
  - `/register/owner`
  - `/owner/get-started`
  - `/post-login`

## Server / Backend

- [ ] Validate preference persistence (migration applied, queries work).
- [ ] Verify post-login routing respects explicit redirects.

## Client / Frontend

- [x] Confirm internal links updated to `/owners/get-started`.
- [ ] Confirm `/register` chooser appears only when intent unknown.
- [ ] Confirm `/register/owner` uses owner copy and routes to the hub.
- [ ] Confirm hub CTA routing:
  - create org
  - add venue -> verify
  - claim listing -> pending
  - import -> existing import flow

## Validation Commands

- [x] `pnpm lint`
- [x] `pnpm build`
- [x] `TZ=UTC pnpm build`

## Manual Smoke

- [ ] From `/owners/get-started` CTA -> signup -> `/owner/get-started`.
- [ ] Hit `/list-your-venue` directly -> redirects to `/owners/get-started`.
- [ ] Login with no redirect:
  - player -> `/home`
  - owner (org exists) -> `/owner`
  - new owner (no org) -> `/owner/get-started`
- [ ] Claim listing path:
  - find curated listing -> submit claim -> see pending state
- [ ] Import path:
  - start import -> upload -> review -> normalize -> commit (ICS/CSV/XLSX)

Follow-up smoke (Phase 7):
- [ ] From `/owner/get-started`, add venue -> create venue -> lands on `/owner/verify/:placeId`.
