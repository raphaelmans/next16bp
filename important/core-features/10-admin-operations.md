# Admin Operations

## Purpose

Admins are platform operators who maintain data quality, approve venue ownership, and ensure trust across the marketplace. They are the bridge between venue owners and the platform's credibility.

## Admin Dashboard

The admin landing page shows operational health at a glance:

- **Pending Claims** counter — ownership claims waiting for review
- **Pending Verifications** counter — venue verification requests in queue
- **Total Courts** — all courts on the platform
- **Reservable Courts** — courts that are fully configured and bookable
- **Active Organizations** — organizations with at least one venue
- Recent pending claims list with quick filters
- Recent activity feed showing approvals, rejections, court additions, and deactivations with timestamps

## Claims Management

When a venue owner claims an existing (curated) venue instead of creating a new one, the claim must be reviewed by an admin.

**What admins see:**
- Tabbed view: All claims, Pending, Approved, Rejected
- Filter by claim type (Ownership claim vs. Removal request)
- Search and pagination
- Each claim shows: venue name, organization name, submission date, claim type badge

**Admin actions:**
- **Approve** — The venue is assigned to the claiming organization. The owner can now proceed with court setup.
- **Reject** — The claim is denied. The owner must create a new venue or submit a new claim with better documentation.

**Business impact:** Claims are a critical bottleneck. If admin review takes too long, owners are blocked during onboarding and may abandon the platform. There is currently no SLA tracking or notification to admins about aging claims.

## Venue Verification

Before a venue can accept online bookings, the owner must submit proof of ownership and an admin must approve it.

**What admins see:**
- Grid view of verification requests
- Status badges: Pending, Approved, Rejected
- Venue name, submission date, any notes from the owner
- Uploaded documents (government IDs, business permits, lease agreements, etc.)

**Admin actions:**
- **Approve** — Venue becomes "VERIFIED." The public listing gets a verified badge. Online reservations become possible.
- **Reject** — Venue stays unverified. Owner must resubmit.

**Current gap:** When rejecting, there is no structured way to communicate the rejection reason back to the owner. The owner sees "REJECTED" status but does not know what was wrong or how to fix it.

## Courts Management

Admins have a global view of all courts on the platform.

**Capabilities:**
- List all courts across all venues
- Create or edit courts directly (admin override)
- Transfer court ownership between organizations
- Feature courts in search results (make a court "featured" for promotional placement)
- Toggle court status (active/inactive)

## Admin Tools

- **Notification test utility** — Send test notifications to verify the delivery pipeline works.
- **Data revalidation** — Trigger cache/sync operations when data becomes stale.

## What Admin Does NOT Cover (Currently)

- **No user management.** Admins cannot view, edit, or suspend user accounts.
- **No dispute resolution.** There is no admin tool for mediating between players and venues (e.g., contested cancellations, payment disputes).
- **No SLA tracking.** There is no visibility into how long claims or verifications have been pending, no escalation alerts.
- **No analytics.** No dashboard showing platform growth, booking volumes, or revenue metrics.
- **No content moderation.** No tools for reviewing venue descriptions, photos, or chat messages for policy violations.
