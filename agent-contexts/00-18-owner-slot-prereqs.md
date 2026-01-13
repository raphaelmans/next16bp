# [00-18] Owner Slot Prereqs UX

> Date: 2026-01-12
> Previous: 00-17-optional-place-coords.md

## Summary

Aligned the owner court ops flow with v1.2 pricing rules by removing bulk slot price inputs, gating slot publishing on hours + pricing setup, and fixing actions menu navigation so configuration pages are reachable.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/owner/components/courts-table.tsx` | Stop row click propagation for actions dropdown trigger. |
| `src/features/owner/components/bulk-slot-modal.tsx` | Remove price inputs, enforce 60-minute slots, add prerequisites alerts + CTAs. |
| `src/app/(owner)/owner/courts/[id]/slots/page.tsx` | Fetch hours/pricing rules and pass prereq state/links to modal. |

### Planning Docs

| File | Change |
|------|--------|
| `agent-plans/user-stories/14-place-court-migration/14-12-owner-navigates-court-actions-without-unintended-redirects.md` | New story for menu navigation reliability. |
| `agent-plans/user-stories/14-place-court-migration/14-13-owner-is-guided-to-configure-hours-and-pricing-before-publishing-slots.md` | New story for prereq guidance. |
| `agent-plans/user-stories/14-place-court-migration/14-08-owner-configures-hourly-pricing-rules-per-court.md` | Clarify free pricing via hourly rate = 0. |
| `agent-plans/user-stories/14-place-court-migration/14-09-owner-publishes-60-minute-slots-with-prices.md` | Clarify derived pricing and blocking when rules missing. |
| `agent-plans/user-stories/14-place-court-migration/14-00-overview.md` | Update story index. |
| `agent-plans/user-stories/checkpoint-05.md` | New checkpoint for US-14-12/14-13. |
| `agent-plans/14-place-court-migration/14-06-owner-slot-publishing-prereqs.md` | Addendum plan for prereqs UX + nav fixes. |
| `agent-plans/14-place-court-migration/14-00-overview.md` | Add addendum + story list update. |

## Key Decisions

- Bulk slot publishing derives pricing from `court_rate_rule`; no free-text price input.
- Free pricing is represented by hourly rate = 0 in pricing rules.
- Slot publishing UI must guide owners to configure hours/pricing before publishing.

## Next Steps

- [ ] Run `pnpm lint` and `pnpm build`.
- [ ] Consider normalizing “free” representation (`priceCents = 0` vs `null`) across booking flows.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
