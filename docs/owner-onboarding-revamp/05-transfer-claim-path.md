# Transfer / Claim Path (Existing Listing)

This is the path for owners whose venue already exists on KudosCourts as a curated listing.

## Current Behavior (As Built)

- Owners can submit a claim request from the public place detail page ("Claim this listing").
- Claim request requirements:
  - user must be authenticated
  - user must own the selected organization
  - place must be CURATED
  - place must be UNCLAIMED
  - no pending claim already exists
- Admin review approves/rejects the claim.

## New UX Placement (Revamp)

Expose this path inside the owner setup hub as an equal alternative to "Add new venue".

## Before vs After

BEFORE

```text
Owner must find the public listing
  -> open place page
  -> Claim this listing
  -> wait for admin review
```

AFTER

```text
/owner/get-started
  -> Create organization
  -> Choose: Add venue OR Claim existing listing
  -> Claim flow (select listing, submit claim)
  -> Pending state + next steps
```

## Copy Guardrails

- User-facing label: "Claim listing".
- Internal/admin term "Transfer" can be referenced as a subtitle ("Claim (transfer)") only if needed for support alignment.
- Set expectation: admin review is required.
