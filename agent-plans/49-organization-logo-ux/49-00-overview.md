# Organization Logo Visibility - Master Plan

## Overview

Expose the organization logo upload in a high-traffic owner workflow and ensure the logo is visible wherever place branding appears (cards + public detail). This plan targets the owner places hub for discoverability and keeps the rest of the organization profile in settings.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/10-asset-uploads/` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| UX Target | `src/app/(owner)/owner/places/page.tsx` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Owner hub logo upload + data wiring | 1A | Yes |

---

## Module Index

### Phase 1: Owner hub logo upload + data wiring

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Owner places logo card | Agent | `49-01-owner-places-logo-upload.md` |

---

## Dependencies Graph

```
Phase 1 ───── Owner places logo card
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Placement | Owner places hub | High visibility for owners managing public listings |
| Visual style | Bento card + logo avatar | Matches existing cards and brand guidelines |
| Scope | Upload/replace only | Removal not yet supported by backend |

---

## Document Index

| Document | Description |
|----------|-------------|
| `49-00-overview.md` | Master plan |
| `49-01-owner-places-logo-upload.md` | Phase 1 details |
| `organization-logo-ux-dev1-checklist.md` | Developer checklist |

---

## Success Criteria

- [ ] Owners can upload/replace logo from the places hub.
- [ ] Logo appears on public place cards and place detail hero.
- [ ] Lint/build pass.
