# Availability Management - User Stories

## Overview

The Availability Management domain enables organization owners to create and manage time slots for their courts. This is a prerequisite for the reservation flow - courts cannot accept bookings without available time slots.

Owners access slot management through the `/owner/courts/[id]/slots` page, where they can:
- Create single or bulk time slots
- Set per-slot pricing (free or paid)
- View all slots across all statuses
- Block/unblock slots for maintenance or private use
- Delete available slots
- See player information on booked slots

This domain implements PRD Section 9 (Time Slot Management) and Journey 5 (Owner Manages Availability).

---

## References

| Document | Location |
|----------|----------|
| PRD | `business-contexts/kudoscourts-prd-v1.1.md` Section 9, Journey 5 |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Server Context | `agent-contexts/00-01-kudoscourts-server.md` |

---

## Story Index

| ID | Story | Status | Description |
|----|-------|--------|-------------|
| US-05-01 | Owner Creates Time Slots | Active | Single + bulk slot creation with pricing |
| US-05-02 | Owner Views and Manages Slots | Active | View all slots, block/unblock, delete, player info |

---

## Dependencies

| Depends On | Reason |
|------------|--------|
| US-02-02 (Owner Creates Court) | Court must exist before creating slots |
| US-01-01 (Owner Registers Organization) | Owner must have an organization |

---

## Enables

| Story | Domain |
|-------|--------|
| US-06-01 (Player Books Free Court) | 06-court-reservation |
| US-06-02 (Player Books Paid Court) | 06-court-reservation |

---

## Backend Requirements

### NEW: `timeSlot.getForCourt`

The current `timeSlot.getAvailable` only returns AVAILABLE slots (for player discovery). Owners need to see ALL slots regardless of status.

| Attribute | Value |
|-----------|-------|
| Router | `timeSlot` |
| Procedure | `getForCourt` |
| Access | Protected (owner only, verifies court ownership) |
| Input | `{ courtId: string, startDate: string, endDate: string }` |
| Output | `TimeSlotWithPlayerInfo[]` |

**Response includes:**
- All slot fields (id, startTime, endTime, status, priceCents, currency)
- For HELD/BOOKED slots: player info from reservation snapshot
  - `playerName` (from `playerNameSnapshot`)
  - `playerPhone` (from `playerPhoneSnapshot`)

**Implementation notes:**
- Join `reservation` table on `timeSlotId` for HELD/BOOKED slots
- Filter by court ownership via organization
- Order by `startTime` ascending

### Existing Endpoints (Wire to Frontend)

| Endpoint | Current State | Action |
|----------|---------------|--------|
| `timeSlot.create` | Backend complete | Wire hook |
| `timeSlot.createBulk` | Backend complete | Wire hook |
| `timeSlot.block` | Backend complete | Wire hook |
| `timeSlot.unblock` | Backend complete | Wire hook |
| `timeSlot.delete` | Backend complete | Wire hook |

---

## Current Implementation State

| Layer | Status | Notes |
|-------|--------|-------|
| Database Schema | Complete | `time_slot` table with all fields |
| Backend Repository | Complete | All CRUD operations |
| Backend Service | Complete | Ownership verification, overlap prevention |
| tRPC Router | Mostly complete | Missing `getForCourt` |
| Frontend Components | Complete | `SlotList`, `SlotItem`, `BulkSlotModal`, `CalendarNavigation` |
| Frontend Page | Complete | `/owner/courts/[id]/slots/page.tsx` |
| Frontend Hooks | **Mock data** | `use-slots.ts` returns fake data |

---

## Slot Status Reference

Per PRD Section 9.3:

| Status | Description | Owner Actions |
|--------|-------------|---------------|
| `AVAILABLE` | Open for booking | Block, Delete |
| `HELD` | Temporarily locked (paid reservation pending) | View player info |
| `BOOKED` | Confirmed reservation | View player info |
| `BLOCKED` | Manually blocked by owner | Unblock |

---

## Summary

- **Total Stories:** 2
- **Active:** 2
- **Key Deliverable:** Wire frontend hooks to real backend, add `getForCourt` endpoint
