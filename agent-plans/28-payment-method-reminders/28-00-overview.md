# Payment Method Reminders - Master Plan

## Overview

Add owner-facing reminder cards that prompt payment method setup during place creation and on the owner reservations dashboard when no payment methods exist.

### Completed Work (if any)

- None yet

### Reference Documents

| Document | Location |
| --- | --- |
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/15-organization-payment-methods/` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| PRD | `business-contexts/kudoscourts-prd-v1.2.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
| --- | --- | --- | --- |
| 1 | Owner reminders UI + settings anchors | 1A | No |

---

## Module Index

### Phase 1: Owner Reminders

| ID | Module | Agent | Plan File |
| --- | --- | --- | --- |
| 1A | Reminder cards + settings anchors | Agent | `28-01-owner-reminder-ui.md` |

---

## Dependencies Graph

```
Phase 1 ────── 1A
```

---

## Key Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Reminder placement | Place creation + owner reservations | Capture owners before and after first place goes live |
| Deep link style | Hash anchors | Simple, shareable, works with SSR |

---

## Document Index

| Document | Description |
| --- | --- |
| `28-00-overview.md` | Master plan |
| `28-01-owner-reminder-ui.md` | Phase 1 UI implementation |

---

## Success Criteria

- [ ] Reminder card appears on `owner/places/new` when methods = 0
- [ ] Reminder card appears on `owner/reservations` when methods = 0
- [ ] Settings sections expose stable hash anchors
- [ ] No reminders shown when at least one method exists
