# Agent Plans Context

References and context for planning artifacts.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-18 | Added 43-google-oauth-auth plan (server tRPC OAuth + login/register buttons) |
| 2026-01-17 | Noted deferred rename from place → venue (pending explicit request) |
| 2026-01-18 | Added 39-public-navbar-consistency plan (public logo + search routing) |
| 2026-01-18 | Added 40-public-schedule-view plan (public detail CTA + schedule route) |
| 2026-01-18 | Added 41-owner-onboarding-revalidation plan (prevent duplicate orgs; client guard + backend conflict) |
| 2026-01-18 | Added 42-amenities-discovery-filters plan (aggregated amenities filter on /courts) |
| 2026-01-19 | Added 45-booking-conversion-ux plan (conversion funnel: resume-after-login, sticky CTA, discovery polish) |
| 2026-01-18 | Added 37-admin-courts-filters plan (province -> city admin filters) |
| 2026-01-17 | Added 35-courts-discovery-filters plan (province/city discovery filters + search) |
| 2026-01-16 | Added 34-place-location-standardization plan (PH province/city enforcement) |
| 2026-01-15 | Added 33-place-claiming implementation plan (curated → claim → reservable) |
| 2026-01-15 | Added 17-place-claiming user stories (claim curated places) |
| 2026-01-14 | Added 31-owner-reservations-inbox plan (owner triage UX) |
| 2026-01-14 | Added 16-reservation-list-enrichment user stories and 30-reservation-list-enrichment plan |
| 2026-01-14 | Added US-06-04 (My Reservations tabs filtering + accessibility) and 29-my-reservations-tabs plan | 
| 2026-01-13 | Added 24-trpc-react-query-hooks implementation plan (hook API standardization) |
| 2026-01-13 | Added public UI embed plan for Google Maps previews |
| 2026-01-13 | Added 15-organization-payment-methods user stories (org payment methods + policy defaults) |
| 2026-01-13 | Added 27-organization-payment-methods agent plan (org payment methods + org policy defaults) |
| 2025-01-09 | Added 08-p2p-reservation-confirmation implementation plan with 4 phases |
| 2025-01-09 | Added 08-p2p-reservation-confirmation user stories (11 total: 3 parent + 8 sub-stories) |
| 2025-01-09 | Added 10-asset-uploads implementation plan with parallel dev checklists |
| 2025-01-09 | Added 10-asset-uploads user stories for Supabase Storage integration |
| 2026-01-12 | Added PRD v1.2 + ERD spec v1.2 (Place/Court migration) |
| 2026-01-11 | Added 12-reservation-policies user stories and implementation plan |
| 2026-01-10 | Added 11-ui-revamp user stories and implementation plan |
| 2025-01-08 | Added 08-admin-data-entry plan for US-02-03 and US-02-04 |
| 2025-01-08 | Initial creation. Added all reference documents. |

---

## Product Requirements

| Document | Path | Description |
|----------|------|-------------|
| PRD (Current) | `business-contexts/kudoscourts-prd-v1.2.md` | Product requirements document v1.2 (Place/Court model) |
| PRD (Previous) | `business-contexts/kudoscourts-prd-v1.1.md` | Product requirements document v1.1 |
| ERD Spec (Current) | `business-contexts/kudoscourts-erd-specification-v1.2.md` | Database design v1.2 (Place/Court/Sport/Hours/Rate Rules) |

---

## Design References

| Document | Path | Description |
|----------|------|-------------|
| Design System | `business-contexts/kudoscourts-design-system.md` | UI/UX guidelines, colors, typography |
| Server Context | `agent-contexts/00-01-kudoscourts-server.md` | Backend architecture documentation |

---

## User Stories

| Domain | Path | Description |
|--------|------|-------------|
| 00-onboarding | `agent-plans/user-stories/00-onboarding/` | Auth, profile, navigation |
| 01-organization | `agent-plans/user-stories/01-organization/` | Owner registration |
| 02-court-creation | `agent-plans/user-stories/02-court-creation/` | Admin/owner court creation (includes admin filters) |
| 03-court-reservation | `agent-plans/user-stories/03-court-reservation/` | Original player booking (superseded) |
| 04-owner-dashboard | `agent-plans/user-stories/04-owner-dashboard/` | Dashboard data wiring |
| 05-availability-management | `agent-plans/user-stories/05-availability-management/` | Owner time slot management |
| 06-court-reservation | `agent-plans/user-stories/06-court-reservation/` | Player booking (simplified) |
| 07-owner-confirmation | `agent-plans/user-stories/07-owner-confirmation/` | Owner confirms/rejects reservations |
| 08-p2p-reservation-confirmation | `agent-plans/user-stories/08-p2p-reservation-confirmation/` | Future: Full P2P verification |
| 09-client-profile | `agent-plans/user-stories/09-client-profile/` | Client profile management |
| 10-asset-uploads | `agent-plans/user-stories/10-asset-uploads/` | Supabase Storage file uploads |
| 11-ui-revamp | `agent-plans/user-stories/11-ui-revamp/` | Navigation and layout consistency |
| 12-reservation-policies | `agent-plans/user-stories/12-reservation-policies/` | Court-specific reservation policies |
| 14-place-court-migration | `agent-plans/user-stories/14-place-court-migration/` | Place→Court-unit migration and multi-sport venue support |
| 15-organization-payment-methods | `agent-plans/user-stories/15-organization-payment-methods/` | Org-scoped payment methods + reservation policy defaults |
| 16-reservation-list-enrichment | `agent-plans/user-stories/16-reservation-list-enrichment/` | Player reservation lists with real court + slot data |
| 17-place-claiming | `agent-plans/user-stories/17-place-claiming/` | Claim curated places and transfer courts to organizations |

---

## Implementation Plans

| Domain | Path | Status |
|--------|------|--------|
| 05-availability-management | `agent-plans/05-availability-management/` | Complete |
| 06-court-reservation | `agent-plans/06-court-reservation/` | Complete |
| 07-owner-confirmation | `agent-plans/07-owner-confirmation/` | In Progress |
| 08-admin-data-entry | `agent-plans/08-admin-data-entry/` | Pending |
| 08-p2p-reservation-confirmation | `agent-plans/08-p2p-reservation-confirmation/` | Pending |
| 10-asset-uploads | `agent-plans/10-asset-uploads/` | Pending |
| 11-ui-revamp | `agent-plans/11-ui-revamp/` | Ready |
| 12-reservation-policies | `agent-plans/12-reservation-policies/` | Pending |
| 24-trpc-react-query-hooks | `agent-plans/24-trpc-react-query-hooks/` | Pending |
| 27-organization-payment-methods | `agent-plans/27-organization-payment-methods/` | Ready |
| 29-my-reservations-tabs | `agent-plans/29-my-reservations-tabs/` | Pending |
| 30-reservation-list-enrichment | `agent-plans/30-reservation-list-enrichment/` | Pending |
| 31-owner-reservations-inbox | `agent-plans/31-owner-reservations-inbox/` | Pending |
| 33-place-claiming | `agent-plans/33-place-claiming/` | Ready |
| 34-place-location-standardization | `agent-plans/34-place-location-standardization/` | Ready |
| 35-courts-discovery-filters | `agent-plans/35-courts-discovery-filters/` | Ready |
| 37-admin-courts-filters | `agent-plans/37-admin-courts-filters/` | Ready |

---

## Key Technical Context

### Backend Module Structure

```
src/modules/
├── reservation/
│   ├── reservation.router.ts          # Player-facing endpoints
│   ├── reservation-owner.router.ts    # Owner-facing endpoints
│   ├── services/
│   │   ├── reservation.service.ts
│   │   └── reservation-owner.service.ts
│   ├── repositories/
│   │   ├── reservation.repository.ts
│   │   └── reservation-event.repository.ts
│   ├── dtos/
│   │   └── reservation-owner.dto.ts
│   └── errors/
│       └── reservation.errors.ts
├── time-slot/                         # Slot management
├── court/                             # Court management
└── organization/                      # Organization management
```

### Frontend Hook Locations

| Feature | Path |
|---------|------|
| Owner reservations | `src/features/owner/hooks/use-owner-reservations.ts` |
| Owner slots | `src/features/owner/hooks/use-slots.ts` |
| Player booking | `src/features/reservation/hooks/` |

### Design System Quick Reference

| Element | Value |
|---------|-------|
| Primary (Teal) | `#0D9488` - CTAs, confirm buttons |
| Accent (Orange) | `#F97316` - Links, availability |
| Destructive (Red) | `#DC2626` - Reject, cancel, errors |
| Success (Green) | `#059669` - Confirmed status |
| Warning (Amber) | `#D97706` - Pending status |
| Font Headings | Outfit 500-800 |
| Font Body | Source Sans 3 300-600 |

---

## Captured Requirements

- Standardize client-side tRPC usage to `trpc.*.useQuery` / `trpc.*.useMutation` across the repo.
- Replace mixed patterns (`useTRPC()+queryOptions`, `useTRPCClient()+manual queryKey/queryFn`) with a single hook-based API.
- Migrate tRPC cache invalidation to `trpc.useUtils()` helpers wherever the data is tRPC-backed.

### Organization Payment Methods (New)

- Organization owners can manage multiple payment methods: mobile wallet or bank.
- Each payment method has a provider (PH-only constants), account name, account number, and optional per-method instructions.
- Exactly one payment method can be set as the default.
- Players see payment methods only in the reservation payment context; avoid public exposure via time slot endpoints.
- Reservation timing rules are stored at the organization scope with default values (editable later).
