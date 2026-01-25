# Public Marketing Page: /owners/get-started

This is the canonical marketing landing page for court owners.

## Purpose

- Give marketing one link that always leads to the right experience.
- Create a clean, conversion-focused narrative.
- Set expectations: verification required for online reservations.

## Page Structure (Recommended)

Pattern: Funnel (3-step conversion) + objection handling.

```text
Hero
  - H1: Get your venue bookable on KudosCourts
  - Subhead: Create your owner account, add/claim your venue, submit verification.
  - Primary CTA: Create owner account
  - Secondary CTA: Claim existing listing

How it works (3 steps)
  - Step 1: Create organization
  - Step 2: Add or claim venue
  - Step 3: Verify, then enable reservations

Trust & Control
  - You control when bookings start (toggle reservations after verification)
  - What verification is and what documents are accepted

FAQ
  - How long does verification take?
  - Can I configure hours/pricing later?
  - My venue is already listed. How do I claim it?
  - What happens after verification?

Final CTA
  - Create owner account
```

## CTA Behavior

- Primary CTA links to: `/register/owner?redirect=/owner/get-started`.
- Secondary CTA:
  - anchors to the "Claim" section
  - includes a link to search discovery and open the listing to claim.

## SEO Requirements

- This page should be indexable.
- Canonical is `/owners/get-started`.
- Avoid duplicate indexation with `/list-your-venue` by permanently redirecting it.

Suggested metadata:

- Title: `Owner Setup: List Your Venue & Accept Bookings | KudosCourts`
- Description (150-160 chars):
  - `Create an owner account, add or claim your venue, submit verification, and start accepting court bookings on KudosCourts.`

## Redirect Policy For /list-your-venue

`/list-your-venue` becomes legacy and permanently redirects to `/owners/get-started`.

Note: URL fragments (e.g. `#verification`) cannot be preserved by server-side redirects. All internal links should point directly to `/owners/get-started#verification`.
