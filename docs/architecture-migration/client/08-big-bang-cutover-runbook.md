# Big-Bang Cutover Runbook

## Objective

Ship the frontend architecture overhaul as one release event with strict parity and fast rollback capability.

## Roles and Owners

Assign named owners before cutover day:

- Release owner: coordinates timeline and go/no-go decision
- Frontend owner: final technical approver for architecture conformance
- QA owner: parity matrix execution lead
- Observability owner: runtime monitoring and incident triage
- Rollback owner: executes rollback if triggered

## Timeline and Freeze Plan

### T-14 to T-7 Days

1. Complete Wave A and Wave B.
2. Lock high-risk playbooks and finish Wave C critical paths.
3. Start full parity dry-runs.

### T-6 to T-3 Days

1. Code freeze for unrelated frontend changes.
2. Merge remaining migration PRs to integration branch only.
3. Run full `pnpm lint`, `pnpm lint:arch`, and full parity matrix dry-run.
4. Build rollback artifact from pre-migration baseline tag.

### T-2 to T-1 Days

1. Final bug triage and blocker resolution.
2. Cut release candidate from integration branch.
3. Final sign-off meeting using parity evidence.

### T-0 Cutover Day

1. Announce freeze window start.
2. Merge release candidate to production branch.
3. Deploy.
4. Execute post-deploy verification sequence.

## Pre-Cutover Checklist

All items required:

- [x] Baseline tag exists and is verified restorable.
- [x] Integration branch fully merged and up to date.
- [x] `pnpm lint` passes on release candidate.
- [x] `pnpm lint:arch` passes on release candidate.
- [x] All strict conformance numeric targets in `07-validation-and-parity-matrix.md` pass.
- [x] Full manual parity matrix completed.
- [x] No unresolved P0/P1 regressions.
- [x] Rollback command sequence rehearsed.
- [x] Stakeholder communication template prepared.

Evidence reference:

- `docs/architecture-migration/client/parity-evidence-2026-02-18.md`

## Final Verification Sequence (Post-Deploy)

Run in order:

1. Smoke top guest routes (`/`, `/courts`, place/court detail).
2. Smoke auth flows (login/register/magic-link/otp).
3. Smoke reservation flows (book/detail/payment/cancel).
4. Smoke owner flows (setup, availability, bookings, import).
5. Smoke admin flows (claims, verification, courts/tools).
6. Smoke chat/open-play critical actions.
7. Confirm no critical frontend errors in logs/monitoring.

## Go / No-Go Criteria

### Go

- All critical post-deploy smoke scenarios pass.
- No new P0 incidents.
- Error rates and response patterns are stable.

### No-Go / Rollback Trigger

Trigger rollback immediately if:

- Any P0 parity regression is confirmed in production.
- Auth/reservation owner-critical workflows are broken.
- Systemic client-side failures appear after deployment.

## Rollback Plan

1. Release owner declares rollback.
2. Rollback owner deploys baseline artifact/tag.
3. Verify baseline smoke checklist.
4. Announce rollback completion.
5. Start incident postmortem and patch plan.

## Communication Templates

### Pre-Cutover

- Freeze start time
- Expected deployment window
- Owner contacts

### Post-Cutover Success

- Deployment complete
- Initial smoke pass status
- Monitoring window duration

### Rollback Notice

- Reason for rollback
- Impact scope
- Current status and next update time

## Artifacts to Store

- Final parity matrix results
- `pnpm lint` output snapshot
- `pnpm lint:arch` output snapshot
- Architecture gate log with numeric command outputs
- Release SHA and rollback SHA
- Sign-off records
- Incident notes (if any)
