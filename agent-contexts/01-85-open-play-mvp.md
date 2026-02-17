# [01-85] Open Play MVP

> Date: 2026-02-17
> Previous: 01-84-owner-courts-route-moves.md

## Summary

Implemented Open Play end-to-end: hosts can turn reservations into joinable sessions (public/unlisted), players can join/request/waitlist, hosts can moderate participants, and confirmed participants get an in-app group chat. Added cost-sharing UX (suggested split + payment instructions) while keeping payments off-platform, plus basic SEO metadata for Open Play pages.

## Changes Made

### Database + Migrations

| File | Change |
|------|--------|
| `src/lib/shared/infra/db/schema/enums.ts` | Added Open Play enums (status, visibility, join policy, participant role/status). |
| `src/lib/shared/infra/db/schema/open-play.ts` | Added `open_play` + `open_play_participant` tables; later added cost-sharing fields (`paymentInstructions`, `paymentLinkUrl`). |
| `src/lib/shared/infra/db/schema/open-play-chat.ts` | Added `open_play_chat_thread` mapping to Stream channels. |
| `src/lib/shared/infra/db/schema/index.ts` | Exported Open Play schemas. |
| `drizzle/0024_open_play.sql` | Created Open Play + participant + chat thread tables/enums. |
| `drizzle/0025_open_play_cost_sharing.sql` | Added Open Play cost-sharing columns. |

### Backend (tRPC + Services)

| File | Change |
|------|--------|
| `src/lib/modules/open-play/**` | New Open Play module: DTOs, repositories, service, router, errors, factories. |
| `src/lib/modules/open-play/services/open-play.service.ts` | Enforced confirmed-only public discovery, added cost-sharing computation, added cancel action, added host pre-confirmation visibility, join message support, paid-session joinPolicy forcing. |
| `src/lib/modules/chat/open-play-chat.router.ts` | New tRPC router for Open Play chat. |
| `src/lib/modules/chat/services/open-play-chat.service.ts` | Chat gating: reservation must be CONFIRMED and user must be CONFIRMED participant; blocks cancelled sessions; keeps channel members in sync. |
| `src/lib/modules/chat/providers/chat.provider.ts` | Extended provider interface to support member removal. |
| `src/lib/modules/chat/providers/stream-chat.provider.ts` | Implemented `removeMembersFromChannel` (best-effort). |
| `src/lib/shared/infra/trpc/root.ts` | Mounted `openPlay` + `openPlayChat` routers. |

### Frontend (UI + Flows)

| File | Change |
|------|--------|
| `src/features/open-play/**` | New Open Play feature UI (cards/lists/detail), hooks, cost-sharing display, join/leave/moderation, chat panel integration. |
| `src/features/discovery/place-detail/components/sections/place-detail-booking-section.tsx` | Added Book/Open Play toggle and Open Play venue panel. |
| `src/app/(auth)/places/[placeId]/book/page.tsx` | Checkout: "Host as Open Play" config, cost-sharing preview, create Open Play after reservation creation, redirect to Open Play when created, toast on Open Play creation failure. |
| `src/features/reservation/components/reservation-actions-card.tsx` | Reservation detail: Create/View Open Play with cost-sharing fields and paid-session join policy guardrails. |
| `src/app/(auth)/reservations/[id]/page.tsx` | Passed reservation total/currency into Open Play create dialog. |

### Public Pages + SEO

| File | Change |
|------|--------|
| `src/common/app-routes.ts` | Added Open Play route helpers (detail + by place) and included Open Play in public bases. |
| `src/app/(public)/open-play/[openPlayId]/page.tsx` | Added `generateMetadata` (uses public detail; safe fallback on not found). |
| `src/app/(public)/places/[placeId]/open-play/page.tsx` | Added `generateMetadata` using place details. |
| `src/app/(public)/venues/[placeId]/open-play/page.tsx` | Re-exported metadata for the venue alias route. |

### Docs

| File | Change |
|------|--------|
| `docs/open-play/00-overview.md` | Concept + gating rules + chat + cost sharing. |
| `docs/open-play/01-user-flows.md` | Host/joiner flows, sharing, moderation, failure cases. |
| `docs/open-play/02-state-machines.md` | Mermaid state machine diagrams. |
| `docs/open-play/03-cost-sharing.md` | Off-platform reimbursements, suggested split, paid-session policy, Reclub references. |
| `docs/open-play/04-ui-copy.md` | UI microcopy spec for all Open Play surfaces. |
| `docs/open-play/05-seo-and-social.md` | Metadata templates + share text patterns. |

## Key Decisions

- Open Plays are publicly discoverable/joinable only after `reservation.status === CONFIRMED`.
- Cost sharing is off-platform; app shows reservation total + suggested split and stores payment instructions/link for coordination.
- Suggested split basis is `maxPlayers` (includes host): `ceil(reservationTotal / maxPlayers)`.
- Paid sessions force `joinPolicy = REQUEST` (host approval required) to align RSVP confirmation with “paid/approved”.
- Chat is gated to confirmed participants; membership is synchronized and removed on leave/de-confirm.

## Next Steps (if applicable)

- [ ] Apply DB migrations in target environment (`0024`, `0025`).
- [ ] Manual QA: paid vs free sessions, pre-confirmation visibility, join/request/waitlist, promote from waitlist, cancel/close, chat access, SEO metadata fallbacks.
- [ ] Create a git commit when ready.

## Commands to Continue

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm dev
pnpm db:migrate
```
