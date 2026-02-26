# Flow: Court Owner Lists a Venue

## Variant A — No User (Unauthenticated)

**Precondition**: Not logged in

| # | Step | Route / Action | Expected Result |
|---|------|---------------|-----------------|
| 1 | Click "List your Venue" CTA | Navbar, homepage hero, or footer link | Navigates to `/owners/get-started` (public marketing page) |
| 2 | Click "Create owner account" | `/register/owner?redirect=/owner/get-started` | Owner registration form loads (email+password or Google OAuth) |
| 3 | Submit registration | Enter credentials and submit | Email verification screen appears (OTP input) |
| 4 | Enter OTP from email | Verify code | Redirected to `/owner/get-started` (authenticated setup hub) |
| 5 | Setup hub loads | `/owner/get-started` | Page shows 4 progress badges (Organization, Venue, Verify, Go Live) — all grey/secondary. Step cards visible. |
| 6 | Step 1 — Create Organization | Click "Create organization" button | Modal dialog opens with `OrganizationForm` |
| 7 | Fill org name and submit | Complete form in modal | Modal closes; Organization badge turns green with checkmark; card shows "Organization created" with org name |
| 8a | Step 2a — Add Venue | Click "Add venue" (now enabled) | In-hub sheet opens with `PlaceForm` |
| 9a | Fill venue details and save | Complete form in sheet | Sheet closes; Venue badge turns green; card shows "Venue added" |
| 8b | *(Alternative)* Step 2b — Claim Existing Listing | Click "Find my venue" | Search dialog opens |
| 9b | Search for venue and click "Claim" | Enter 2+ chars, select from results | Toast "Claim submitted"; card changes to "Claim pending — Under review" |
| 10 | Step 3 — Configure Courts | Click "Set up courts" (now enabled) | In-hub sheet opens with `CourtForm` |
| 11 | Add at least one court with schedule/pricing | Complete form in sheet | Sheet closes; Go Live badge reflects status ("Courts configured" or "Courts need updates") |
| 12 | Step 4 — Verify Venue | Click verification CTA (e.g. "Submit verification") | In-hub verification sheet opens |
| 13 | Upload proof-of-ownership documents and submit | Complete verification form in sheet | Sheet closes; Verify card updates (typically yellow "Under review") |
| 14 | *(Post-review)* Verification approved | Admin action | Verify badge turns green "Complete"; if all 4 steps done, success banner appears: "You're all set!" |

### Edge Cases

- Redirect URL survives the registration + OTP round-trip (step 2 → 4)
- Steps 2–4 buttons are disabled until their prerequisites are met (org → venue → courts/verify)
- Claim and Add Venue are mutually exclusive paths for step 2
- Optional navigation links from setup cards still include `?from=setup` where applicable
- Returning to setup hub after each step shows updated status (badges + cards)
- "You're all set!" banner only appears when `isSetupComplete === true`

---

## Variant B — Newly Registered User

**Precondition**: Logged in with owner role, no organization or venue yet

| # | Step | Route / Action | Expected Result |
|---|------|---------------|-----------------|
| 1 | Navigate to setup hub | `/owner/get-started` | Page shows 4 progress badges — all grey/secondary. Step cards visible. No auth redirect. |
| 2 | Step 1 — Create Organization | Click "Create organization" button | Modal dialog opens with `OrganizationForm` |
| 3 | Fill org name and submit | Complete form in modal | Modal closes; Organization badge turns green with checkmark; card shows "Organization created" with org name |
| 4a | Step 2a — Add Venue | Click "Add venue" (now enabled) | In-hub sheet opens with `PlaceForm` |
| 5a | Fill venue details and save | Complete form in sheet | Sheet closes; Venue badge turns green; card shows "Venue added" |
| 4b | *(Alternative)* Step 2b — Claim Existing Listing | Click "Find my venue" | Search dialog opens |
| 5b | Search for venue and click "Claim" | Enter 2+ chars, select from results | Toast "Claim submitted"; card changes to "Claim pending — Under review" |
| 6 | Step 3 — Configure Courts | Click "Set up courts" (now enabled) | In-hub sheet opens with `CourtForm` |
| 7 | Add at least one court with schedule/pricing | Complete form in sheet | Sheet closes; Go Live badge reflects status ("Courts configured" or "Courts need updates") |
| 8 | Step 4 — Verify Venue | Click verification CTA (e.g. "Submit verification") | In-hub verification sheet opens |
| 9 | Upload proof-of-ownership documents and submit | Complete verification form in sheet | Sheet closes; Verify card updates (typically yellow "Under review") |
| 10 | *(Post-review)* Verification approved | Admin action | Verify badge turns green "Complete"; if all 4 steps done, success banner appears: "You're all set!" |

### Edge Cases

- No auth redirect occurs (user is already logged in)
- Steps 2–4 buttons are disabled until their prerequisites are met (org → venue → courts/verify)
- Claim and Add Venue are mutually exclusive paths for step 2
- Optional navigation links from setup cards still include `?from=setup` where applicable
- Returning to setup hub after each step shows updated status (badges + cards)
- "You're all set!" banner only appears when `isSetupComplete === true`

---

## Key Routes

| Route | Purpose |
|-------|---------|
| `/owners/get-started` | Public owner marketing page |
| `/register/owner?redirect=...` | Owner registration |
| `/owner/get-started` | Authenticated setup hub |
| In-hub add venue sheet | Add venue |
| In-hub configure courts sheet | Court setup |
| In-hub verification sheet | Verification submission |
