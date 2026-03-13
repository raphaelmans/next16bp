# Admin Operations (Operational Reference)

_Supporting operational reference. Read after the primary owner docs in [00-overview.md](./00-overview.md)._

## Purpose

Admin tools support marketplace trust and public-data quality: reviewing claims, reviewing verifications, moderating reviews, and triggering selected operational tools.

## Current Admin Snapshot

The admin surface is partly live and partly placeholder:

- pending claim and pending verification counts are live
- court totals and reservable-court counts are live
- active-organization count is still placeholder
- recent activity is still mock data
- some pending-claim list rows still use placeholder venue/organization labeling

## Claims Management

Claims review is currently a pending-first workflow, not a fully backfilled all-status queue.

Current admin behavior includes:

- pending claims list
- claim detail surface
- approve/reject review actions
- review notes captured on the claim record

## Venue Verification

Admins can review submitted venue verification requests, inspect owner-supplied notes/documents, and approve or reject with recorded review context.

## Courts And Public Data Tools

Current admin tooling includes:

- global court-management surfaces
- selected featured/public-data controls
- notification test tooling
- on-demand revalidation tools for cached public pages

## Review Moderation

Admin now includes review moderation for place reviews:

- filter active vs removed reviews
- filter by rating
- remove a review with an optional reason

## What Admin Still Does Not Cover

- no user-account management or suspension tools
- no dispute-resolution workflow for booking/payment conflicts
- no SLA/aging workflow for claims and verifications
- no real analytics dashboard for growth, booking volume, or revenue
- no broad moderation tooling for venue photos or chat content
