# Court Creation - User Stories

## Overview

The Court Creation feature domain enables two types of court listings on the platform: admin-curated courts for bootstrapping inventory, and owner-created courts for active reservation management.

**Curated Courts** are created by platform administrators to populate the discovery experience before owners onboard. These are view-only listings with external contact information, allowing players to find courts even if the owner hasn't joined the platform yet.

**Owner Courts** are created by organization owners who want to accept reservations through KudosCourts. These courts are immediately reservable and linked to the owner's organization for management.

This domain depends on the organization flow (01-organization) and feeds into the reservation flow (03-court-reservation).

---

## References

| Document | Location |
|----------|----------|
| PRD | `business-contexts/kudoscourts-prd-v1.2.md` Sections 4.3, 5.2 |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Server Context | `agent-contexts/00-01-kudoscourts-server.md` |

---

## Story Index

| ID | Story | Status | Supersedes |
|----|-------|--------|------------|
| US-02-01 | Admin Creates Curated Court | Active | - |
| US-02-02 | Owner Creates Court | Active | - |
| US-02-03 | Admin Data Entry Form | Active | - |
| US-02-04 | CSV Import Script | Active | - |
| US-02-05 | Owner Creates Court via Setup Wizard | Active | US-02-02 |
| US-02-06 | Owner Edits Court Details & Pricing | Active | - |
| US-02-07 | Admin Batch Curated Court Entry | Active | - |

---

## Summary

- Total: 7
- Active: 7
- Superseded: 0

---

## New Stories (Data Entry)

### US-02-03: Admin Data Entry Form

A simplified data entry form at `/admin/courts/data-entry` for rapid manual court population. Uses modular admin-specific components (`admin-input.tsx`, `admin-select.tsx`, etc.) that can be reused across other admin forms.

**Key Features:**
- Simple single-page form (no card sections)
- Wired to real `admin.court.createCurated` API
- "Create Another" flow for bulk entry
- Optional lat/lng with Manila defaults

### US-02-04: CSV Import Script

A CLI script at `scripts/import-curated-courts.ts` for bulk importing courts from CSV files.

**Key Features:**
- Transaction-safe (rollback on any error)
- Duplicate detection by name + city
- Validates all rows before inserting
- Sample template at `scripts/templates/curated-courts-template.csv`

**Usage:**
```bash
npx tsx scripts/import-curated-courts.ts --file ./data/courts.csv
```

### US-02-07: Admin Batch Curated Court Entry

A batch admin portal at `/admin/courts/batch` for adding multiple curated courts in one submission.

**Key Features:**
- Multi-row batch form with add/remove rows
- Per-row validation and results summary
- Optional coordinates stored as null when omitted
- Full metadata support (contacts, amenities, photo URLs)
- Duplicate skipping by name + city

---

## New Stories (Owner Wizard & Editing)

### US-02-05: Owner Creates Court via Setup Wizard

A step-by-step wizard experience for owner court creation using nuqs query params to preserve progress, validation per step, and a guided submit flow that leads directly into slot management.

**Key Features:**
- Step-based navigation with `step` query param
- Required-field gating per step
- Progress preserved on refresh and browser navigation

### US-02-06: Owner Edits Court Details & Pricing

An edit flow that lets owners update court information, payment configuration, and default pricing while ensuring future slots without custom prices reflect the latest default rate.

**Key Features:**
- Pre-filled edit form with existing court details
- Update payment settings and default rate
- Propagate new default price to future slots using defaults
