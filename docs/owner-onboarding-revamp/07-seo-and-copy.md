# SEO + Copy Guardrails

This is a lightweight checklist to keep the revamp consistent and rankable.

## SEO (Technical)

- `/owners/get-started` is canonical and indexable.
- `/list-your-venue` permanently redirects to `/owners/get-started`.
- Remove `/list-your-venue` from sitemap and internal navigation; update all internal links to the new route.
- Keep one canonical URL per intent.

## SEO (On-page)

Recommended keyword cluster:
- list your venue
- accept court bookings
- court booking system
- pickleball court reservations
- manage courts and availability

Metadata guidance for `/owners/get-started`:
- Title includes intent + brand.
- Description includes the action sequence: create account, add/claim venue, verify, accept bookings.

## Copywriting Principles

- Progressive disclosure: ask for the minimum to start; optional steps are clearly skippable.
- Make the "bookable" gates explicit.
- Use trust language:
  - verification builds trust
  - owner controls when reservations start

Avoid:
- Overpromising image/screenshot import outcomes while AI extraction is not implemented.
- Mixing primary CTAs (teal) and accent CTAs side-by-side.

## Microcopy Templates

Owner setup hub card subtitles:
- Organization: "Create the business entity you will manage venues under."
- Add venue: "Add a new venue listing, then submit verification."
- Claim listing: "Already listed? Request ownership of an existing listing."
- Import: "Upload existing bookings so availability stays accurate."

## Analytics (Recommended Events)

- `funnel.owner_get_started_viewed`
- `funnel.owner_get_started_cta_clicked`
- `funnel.owner_register_owner_started`
- `funnel.owner_org_created`
- `funnel.owner_venue_created`
- `funnel.owner_claim_submitted`
- `funnel.owner_import_uploaded`
- `funnel.owner_verification_submitted`
- `funnel.owner_reservations_enabled`
