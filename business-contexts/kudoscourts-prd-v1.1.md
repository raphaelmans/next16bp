# KudosCourts — Product Requirements Document (MVP)

**Version:** 1.1  
**Last Updated:** January 7, 2025  
**Status:** Draft

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | - | - | Initial MVP specification |
| 1.1 | 2025-01-07 | - | Added court claiming flow, detailed data model decisions, multi-currency support, audit trail requirements, refined reservation lifecycle |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals (MVP)](#3-goals-mvp)
4. [Users & Personas](#4-users--personas)
5. [Court Types & Behavior](#5-court-types--behavior)
6. [Court Claiming Flow](#6-court-claiming-flow)
7. [Core User Journeys](#7-core-user-journeys)
8. [Reservation System](#8-reservation-system)
9. [Time Slot Management](#9-time-slot-management)
10. [Discovery & Availability](#10-discovery--availability)
11. [Player Profiles](#11-player-profiles)
12. [Organization Management](#12-organization-management)
13. [Ads (MVP Monetization)](#13-ads-mvp-monetization)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Audit & Compliance](#15-audit--compliance)
16. [Success Metrics](#16-success-metrics)
17. [Legal & Liability Requirements](#17-legal--liability-requirements)
18. [Deferred (Not in MVP)](#18-deferred-not-in-mvp)

---

## 1. Overview

KudosCourts is a player-first, location-based pickleball court discovery and reservation platform. The MVP focuses on helping players find courts and complete reservations through a unified flow, while monetizing via a simple on-page banner ad.

The platform supports:

- **Manually curated courts** — View-only listings with external contact information
- **Reservable courts** — Full booking capability with P2P-style payment confirmation
- **Court claiming** — Admin-approved process for organizations to claim curated courts

KudosCourts does not process payments or facilitate direct communication between players and court owners.

---

## 2. Problem Statement

Pickleball players lack a single, reliable way to discover courts and reserve time slots. Meanwhile, many court owners/organizations do not have an online reservation system, resulting in fragmented booking processes across social media pages, messaging apps, spreadsheets, and calls.

**KudosCourts solves this by providing:**

- One discovery layer for players
- One standardized reservation engine for participating courts
- A neutral platform that avoids payment and communication liability
- A pathway for curated courts to become fully bookable

---

## 3. Goals (MVP)

### 3.1 Primary Goals

| Goal | Description |
|------|-------------|
| Discovery | Enable players to discover pickleball courts by location |
| Reservation | Enable players to reserve courts using a unified booking flow |
| P2P Payment | Support payment confirmation without handling money |
| Near-real-time Availability | Provide current slot availability (polling acceptable for MVP) |
| Revenue | Generate early revenue via banner ad placement |
| Court Claiming | Allow organizations to claim and manage curated court listings |

### 3.2 Explicit Product Constraints

- Player experience is the primary focus (players-first approach)
- Court inventory may be bootstrapped by manual curation before owner onboarding exists
- No payment processing — all payments happen externally (GCash, bank transfer, cash)
- No in-app messaging between players and owners
- Court claiming requires admin approval

---

## 4. Users & Personas

### 4.1 Player (Primary User)

**Needs:**
- Find courts near them
- See hours, amenities, and photos
- Reserve a slot when available
- For paid courts: confirm payment without in-app payment processing

**Common Behaviors:**
- Mobile-first usage
- Short time-to-action (wants to book quickly)
- May not want to create a full profile initially

### 4.2 Organization Owner

**Needs:**
- List multiple locations and courts
- Publish and manage availability
- Confirm payments for reservations (P2P confirmation)
- Claim existing curated court listings

**MVP Simplification:**
- Owner-only access (no staff roles)
- Single owner per organization

### 4.3 Platform Admin (Internal)

**Needs:**
- Review and approve court claiming requests
- Manage curated court inventory
- Handle removal requests

---

## 5. Court Types & Behavior

### 5.1 Court Type Overview

| Attribute | Curated Court | Reservable Court |
|-----------|---------------|------------------|
| Purpose | Bootstrap inventory | Full booking capability |
| Organization | Optional (can be unclaimed) | Required |
| Booking | View-only, external contact | In-app reservation |
| Payment | N/A | Free or Paid (P2P) |
| Availability | Not shown | Slot-based display |

### 5.2 Curated Courts (Default at Launch)

**Purpose:** Bootstrap inventory quickly without requiring court owner participation.

**Behavior:**
- Discoverable via location search + map
- Court detail page includes:
  - Name and address
  - Photos (if available)
  - Amenities (if available)
  - Contact socials (Facebook, Viber, Instagram, website)
- View-only: no booking inside KudosCourts
- Clearly labeled as "Contact to Book" or equivalent

**Claim Status:**
- `UNCLAIMED` — Default state, available for claiming
- `CLAIM_PENDING` — Claim request submitted, awaiting admin approval
- `CLAIMED` — Owned by an organization (transitions to Reservable)
- `REMOVAL_REQUESTED` — Owner requested removal from listing

**Metric Behavior:**
- Excluded from reservation funnel metrics (e.g., completion rate)

### 5.3 Reservable Courts (Managed/Participating)

**Purpose:** Courts that use the KudosCourts reservation engine.

**Behavior:**
- Discoverable via location search + map
- Court detail includes availability calendar and booking UI
- Supports two pricing models:
  - **Free** — No payment required, immediate confirmation
  - **Paid** — Requires P2P payment confirmation flow

**Requirements:**
- Must be owned by an organization
- Must have at least one time slot configured to accept bookings

---

## 6. Court Claiming Flow

### 6.1 Overview

Organizations can request to claim ownership of curated courts. This transitions the court from view-only to fully reservable.

### 6.2 Claiming Process

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐    ┌───────────┐
│ Org owner   │───►│ Find curated │───►│ Submit      │───►│ Admin        │───►│ Court now │
│ logs in     │    │ court        │    │ claim       │    │ approves     │    │ reservable│
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘    └───────────┘
```

**Step 1: Submit Claim Request**
- Organization owner identifies an unclaimed curated court
- Submits claim request with optional justification notes
- Court's claim status → `CLAIM_PENDING`
- Claim request created with status `PENDING`

**Step 2: Admin Review**
- Admin reviews claim request in admin dashboard
- Can view requester's organization details
- Approves or rejects with optional notes

**Step 3a: Approval**
- Claim request status → `APPROVED`
- Court claim status → `CLAIMED`
- Court type → `RESERVABLE`
- Court assigned to requesting organization
- Court detail migrated from curated format to reservable format
- Organization can now manage availability and receive bookings

**Step 3b: Rejection**
- Claim request status → `REJECTED`
- Court claim status → `UNCLAIMED`
- Requester notified (future: email notification)

### 6.3 Removal Request Flow

Claimed court owners may request to remove their listing:

1. Owner submits removal request
2. Court claim status → `REMOVAL_REQUESTED`
3. Admin reviews and processes removal
4. Court either deactivated or returned to curated status

### 6.4 Audit Trail

All claim request status transitions are logged with:
- Previous status
- New status
- User who triggered the change
- Timestamp
- Optional notes

---

## 7. Core User Journeys

### Journey 1: Discover a Court (Curated / View-Only)

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Player opens app/site | Display search interface |
| 2 | Searches by location | Query courts, display on map + list |
| 3 | Selects a curated court | Show court detail page |
| 4 | Views contact information | Display social links (Facebook, Viber, etc.) |
| 5 | Leaves platform to contact | External redirect |

### Journey 2: Discover and Reserve a Free Court

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Player searches by location | Display reservable courts |
| 2 | Selects a free court | Show court detail with availability |
| 3 | Picks date and time slot | Validate slot is available |
| 4 | Confirms reservation | Create reservation (status: CONFIRMED) |
| 5 | Views confirmation | Display reservation details |

**Transaction:** Slot status changes to BOOKED, reservation event logged.

### Journey 3: Discover and Reserve a Paid Court (P2P)

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Player searches by location | Display reservable courts |
| 2 | Selects a paid court | Show court detail with pricing |
| 3 | Picks date and time slot | Validate slot is available |
| 4 | Initiates reservation | Slot HELD, 15-min timer starts |
| 5 | Views payment instructions | Display GCash/bank details |
| 6 | Pays externally | (Outside platform) |
| 7 | Accepts T&C, clicks "I Have Paid" | Status → PAYMENT_MARKED_BY_USER |
| 8 | (Optional) Uploads proof | Store payment proof |
| 9 | Owner confirms payment | Status → CONFIRMED |
| 10 | Views confirmation | Display reservation details |

**Transaction:** Multiple status transitions, each logged as reservation events.

### Journey 4: Owner Confirms Payment

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Owner opens dashboard | Display pending reservations |
| 2 | Views reservation details | Show player info, slot, payment proof |
| 3 | Confirms payment | Reservation → CONFIRMED, Slot → BOOKED |
| 4 | (Automatic) Player notified | (Future: push/email notification) |

### Journey 5: Owner Manages Availability

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Owner opens dashboard | Display court list |
| 2 | Selects court | Show availability calendar |
| 3 | Creates time slots | Validate no overlap, save slots |
| 4 | Sets pricing per slot | Store price and currency |
| 5 | Slots become available | Players can now book |

---

## 8. Reservation System

### 8.1 Reservation Statuses

| Status | Description | Slot State |
|--------|-------------|------------|
| `CREATED` | Initial state (transitional) | — |
| `AWAITING_PAYMENT` | Paid court, waiting for player to pay | HELD |
| `PAYMENT_MARKED_BY_USER` | Player marked as paid, awaiting owner confirmation | HELD |
| `CONFIRMED` | Reservation complete | BOOKED |
| `EXPIRED` | Payment window expired | AVAILABLE (released) |
| `CANCELLED` | Reservation cancelled | AVAILABLE (released) |

### 8.2 Reservation Lifecycle — Free Courts

```
┌─────────┐         ┌───────────┐
│ CREATED │────────►│ CONFIRMED │
└─────────┘         └───────────┘
     │
     │              ┌───────────┐
     └─────────────►│ CANCELLED │
                    └───────────┘
```

- Immediate confirmation upon booking
- No payment window or TTL

### 8.3 Reservation Lifecycle — Paid Courts

```
┌─────────┐    ┌──────────────────┐    ┌───────────────────────┐    ┌───────────┐
│ CREATED │───►│ AWAITING_PAYMENT │───►│ PAYMENT_MARKED_BY_USER│───►│ CONFIRMED │
└─────────┘    └──────────────────┘    └───────────────────────┘    └───────────┘
                        │
                        │ (15-min TTL expires)
                        ▼
                   ┌─────────┐
                   │ EXPIRED │
                   └─────────┘
```

### 8.4 TTL (Time-to-Live) Rules

| Rule | Value |
|------|-------|
| Payment window | 15 minutes |
| Slot hold | Soft lock during payment window |
| Expiration behavior | Slot released, reservation marked EXPIRED |
| Same-day booking | Permitted for both free and paid courts |

### 8.5 Player Information Snapshot

When a reservation is created, the system captures:
- Player display name
- Player email
- Player phone number

This ensures historical accuracy if the player updates their profile after booking.

---

## 9. Time Slot Management

### 9.1 Design Approach

**Explicit Slot Creation** — Every bookable slot is a database record.

**Rationale:**
- Simple availability queries
- Transactional integrity for bookings
- Easy to block individual slots
- Clear audit trail

**UI handles bulk creation** — The frontend provides calendar-style interfaces for creating multiple slots; the backend receives explicit slot records.

### 9.2 Time Slot Attributes

| Attribute | Description |
|-----------|-------------|
| Court | Which court the slot belongs to |
| Start time | Slot start (timestamp with timezone) |
| End time | Slot end (timestamp with timezone) |
| Duration | Variable (stored as start/end, not fixed minutes) |
| Status | AVAILABLE, HELD, BOOKED, BLOCKED |
| Price | Amount in smallest currency unit (cents) |
| Currency | ISO 4217 code (PHP, USD, etc.) |

### 9.3 Time Slot Statuses

| Status | Description | Who Can Transition |
|--------|-------------|-------------------|
| `AVAILABLE` | Open for booking | System (on release) |
| `HELD` | Temporarily locked during payment window | System (on reservation start) |
| `BOOKED` | Confirmed reservation | System (on confirmation) |
| `BLOCKED` | Manually blocked by owner | Owner |

### 9.4 Status Transitions

```
AVAILABLE ──┬──► HELD ──┬──► BOOKED
            │           │
            │           └──► AVAILABLE (TTL expired)
            │
            └──► BLOCKED ──► AVAILABLE (owner unblocks)
```

### 9.5 Pricing Model

**Per-slot pricing with multi-currency support:**

- Each slot can have its own price
- Supports different rates for peak hours, evenings, weekends
- Currency stored per slot (ISO 4217)
- Default currency configured per court
- NULL price = free slot

**Examples:**
- Morning slot: ₱200/hour
- Evening slot: ₱350/hour
- Weekend slot: ₱400/hour

### 9.6 Overlap Prevention

Handled at the repository layer:
- Before creating a slot, check for overlapping time ranges
- Reject creation if overlap detected
- Provides clear error messaging to owner

---

## 10. Discovery & Availability

### 10.1 Discovery Requirements

| Feature | Description |
|---------|-------------|
| Location search | Search by current location or city/area name |
| List view | Scrollable list of courts with key details |
| Map view | Google Maps embed with court markers |
| Filtering | By court type (curated vs reservable) |
| Both types shown | Curated and reservable courts in same results |

### 10.2 Availability Requirements

| Feature | Description |
|---------|-------------|
| Real-time updates | Near-real-time via polling (not websockets) |
| Calendar view | Date picker for selecting booking date |
| Slot display | Available slots shown with time and price |
| Visual status | Clear indication of available vs booked |

---

## 11. Player Profiles

### 11.1 Overview

Players authenticate via Supabase Auth and have an optional profile for additional details.

### 11.2 Profile Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| Display name | No | Friendly name shown to court owners |
| Email | No | Contact email (may differ from auth email) |
| Phone number | No | Contact phone for reservations |
| Avatar | No | Profile picture URL |

### 11.3 MVP Simplification

- Profile creation is optional
- Minimal fields for v1
- No social features or player history display
- Profile updates do not affect historical reservation snapshots

---

## 12. Organization Management

### 12.1 Overview

Organizations represent court owners/operators (tenants in the system).

### 12.2 Organization Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| Name | Yes | Organization display name |
| Slug | Yes | URL-friendly identifier (unique) |
| Owner | Yes | User who owns/manages the organization |
| Active status | Yes | Can be deactivated by admin |

### 12.3 Organization Profile

Extended information for public display:

| Attribute | Description |
|-----------|-------------|
| Description | About the organization |
| Logo | Organization logo URL |
| Contact email | Public contact email |
| Contact phone | Public contact phone |
| Address | Business address |

### 12.4 MVP Simplification

- One owner per organization (no staff roles)
- Owner manages all courts under the organization
- No self-registration (admin creates organizations or via claiming flow)

---

## 13. Ads (MVP Monetization)

### 13.1 Scope

- One banner ad only
- Hardcoded placement and content for MVP

### 13.2 Placement

| Location | Priority |
|----------|----------|
| Discovery screen (map/list page) | Primary |
| Court detail page | Secondary (optional) |

### 13.3 Requirements

- Ad does not block or degrade core user flows
- Non-intrusive placement
- No tracking or analytics required for MVP

### 13.4 Out of Scope (MVP)

- Ad targeting
- Ad rotation
- Advertiser dashboard
- Click/impression analytics

---

## 14. Non-Functional Requirements

### 14.1 Multi-tenancy & Data Safety

| Requirement | Description |
|-------------|-------------|
| Tenant isolation | Organization data is isolated; owners only see their courts |
| Double-booking prevention | System prevents booking same slot twice |
| Row-level security | Database enforces access control |

### 14.2 Reliability

| Requirement | Description |
|-------------|-------------|
| Transaction consistency | Reservation state transitions are atomic |
| Slot integrity | Slot status always matches reservation status |
| TTL enforcement | Background job expires stale reservations |

### 14.3 Performance (MVP Scale)

| Metric | Target |
|--------|--------|
| Organizations | ~100 in early scale |
| Concurrent users | Moderate (polling acceptable) |
| Response time | < 2s for search and booking |

### 14.4 Data Retention

| Data Type | Retention |
|-----------|-----------|
| Active reservations | Indefinite |
| Past reservations | 1 year minimum |
| Time slots | Archive after 90 days |
| Audit logs | 1 year minimum |

---

## 15. Audit & Compliance

### 15.1 Reservation Audit Trail

All reservation status transitions are logged:

| Field | Description |
|-------|-------------|
| Reservation ID | Which reservation |
| From status | Previous status (null for creation) |
| To status | New status |
| Triggered by | User ID or SYSTEM |
| Role | PLAYER, OWNER, or SYSTEM |
| Timestamp | When the transition occurred |
| Notes | Optional context |

### 15.2 Claim Request Audit Trail

All claim request status transitions are logged:

| Field | Description |
|-------|-------------|
| Claim request ID | Which request |
| From status | Previous status |
| To status | New status |
| Triggered by | Admin user ID |
| Timestamp | When the transition occurred |
| Notes | Review notes |

### 15.3 Purpose

- Dispute resolution between players and owners
- Accountability for admin actions
- Debugging and support
- Future analytics on conversion funnel

---

## 16. Success Metrics

### 16.1 Primary Metric

**Reservation Completion Rate**
- Definition: Confirmed reservations / Reservation attempts
- Excludes: Curated court views (no booking capability)

### 16.2 Supporting Metrics

| Metric | Description |
|--------|-------------|
| Search-to-detail conversion | Users who view a court after searching |
| Detail-to-reservation start | Users who initiate booking after viewing |
| Time-to-confirm (P2P) | Average time from reservation start to owner confirmation |
| TTL expiration rate | Percentage of paid reservations that expire |
| Active courts listed | Total courts (curated + reservable) |
| Claim conversion rate | Approved claims / Total claim requests |

---

## 17. Legal & Liability Requirements

### 17.1 Platform Neutrality

KudosCourts must remain neutral and avoid payment liability.

### 17.2 Required Disclosures

Terms & Conditions must clearly state:
- KudosCourts does not process or verify payments
- Payment disputes are between player and court owner
- KudosCourts is not liable for booking disputes

### 17.3 User Acknowledgement

Before marking payment as complete, players must:
- Accept Terms & Conditions via explicit checkbox
- Acknowledge the payment disclaimer

### 17.4 Audit Trail

- All payment confirmations are logged
- Player acknowledgement timestamp preserved
- Supports dispute investigation if needed

---

## 18. Deferred (Not in MVP)

The following features are explicitly out of scope for MVP:

| Feature | Reason |
|---------|--------|
| Client spaces / subdomains | Complexity; evaluate post-MVP |
| Owner self-registration | Use claiming flow instead |
| Reviews and ratings | Requires moderation system |
| Messaging / chat | Liability concerns |
| Refund / dispute resolution | Out of platform scope |
| Staff roles and permissions | Single owner sufficient for MVP |
| Custom domains / white-labeling | Enterprise feature |
| Advanced advertising | Requires ad platform integration |
| Push notifications | Can use email for MVP |
| Recurring bookings | Single booking sufficient for MVP |
| Waitlist for full slots | Complexity |
| Calendar integrations | Post-MVP enhancement |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Curated Court | A court added by KudosCourts team, view-only with external contact info |
| Reservable Court | A court with in-app booking capability, owned by an organization |
| P2P Payment | Peer-to-peer payment outside KudosCourts (GCash, bank, cash) |
| TTL | Time-to-live; the 15-minute window for completing payment |
| Soft Lock | Temporary hold on a slot during payment window (HELD status) |
| Claim | Process of an organization taking ownership of a curated court |
| Organization | A court owner/operator entity (tenant in multi-tenant system) |
| Slot | A bookable time period for a court |

---

## Appendix B: Related Documents

| Document | Description |
|----------|-------------|
| User Stories & Use Cases | Detailed acceptance criteria for each feature |
| ERD Specification | Database design and technical implementation details |
| DDL Script | PostgreSQL schema definition |

---

## Appendix C: Open Questions

| Question | Status | Decision |
|----------|--------|----------|
| Email notifications for reservation status changes? | Deferred | Post-MVP |
| SMS notifications? | Deferred | Post-MVP |
| Multiple slots per reservation? | Deferred | Single slot for MVP |
| Cancellation policy configuration? | Deferred | Simple cancellation for MVP |
| Owner-initiated cancellation? | TBD | Need to define flow |

---

*End of Document*
