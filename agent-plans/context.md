# Agent Plans Context

References and context for planning artifacts.

---

## Changelog

| Date | Change |
|------|--------|
| 2025-01-09 | Added 08-p2p-reservation-confirmation implementation plan with 4 phases |
| 2025-01-09 | Added 08-p2p-reservation-confirmation user stories (11 total: 3 parent + 8 sub-stories) |
| 2025-01-09 | Added 10-asset-uploads implementation plan with parallel dev checklists |
| 2025-01-09 | Added 10-asset-uploads user stories for Supabase Storage integration |
| 2025-01-08 | Added 08-admin-data-entry plan for US-02-03 and US-02-04 |
| 2025-01-08 | Initial creation. Added all reference documents. |

---

## Product Requirements

| Document | Path | Description |
|----------|------|-------------|
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` | Product requirements document v1.1 |

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
| 02-court-creation | `agent-plans/user-stories/02-court-creation/` | Admin/owner court creation |
| 03-court-reservation | `agent-plans/user-stories/03-court-reservation/` | Original player booking (superseded) |
| 04-owner-dashboard | `agent-plans/user-stories/04-owner-dashboard/` | Dashboard data wiring |
| 05-availability-management | `agent-plans/user-stories/05-availability-management/` | Owner time slot management |
| 06-court-reservation | `agent-plans/user-stories/06-court-reservation/` | Player booking (simplified) |
| 07-owner-confirmation | `agent-plans/user-stories/07-owner-confirmation/` | Owner confirms/rejects reservations |
| 08-p2p-reservation-confirmation | `agent-plans/user-stories/08-p2p-reservation-confirmation/` | Future: Full P2P verification |
| 09-client-profile | `agent-plans/user-stories/09-client-profile/` | Client profile management |
| 10-asset-uploads | `agent-plans/user-stories/10-asset-uploads/` | Supabase Storage file uploads |

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

None - all requirements documented in PRD and user stories.
