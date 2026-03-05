# Owner Onboarding

## Purpose

The onboarding flow converts a new signup into a fully operational venue. It is the most critical conversion funnel on the platform — if an owner does not complete setup, the platform gains no supply.

## Entry Points

Two parallel experiences backed by the same underlying status tracking:

| Surface | Style | Best For |
|---------|-------|----------|
| **Setup Wizard** | Linear, step-by-step with progress bar | First-time users who need guidance |
| **Hub View** | Card grid, non-linear, pick any task | Returning users who want to jump to a specific step |

Both are accessible from the "Get Started" nav item, which appears while setup is incomplete and disappears once complete.

## Wizard Steps

7 steps in fixed order. The first three are mandatory (no skip). The next three can be skipped during the wizard but must eventually be completed for the venue to go live.

### Step 1: Create Organization — Required

The user provides an organization name. A URL slug is auto-generated. Once created, the organization is the top-level entity that owns venues, courts, and team memberships.

### Step 2: Add or Claim a Venue — Required

Two paths:

- **Add New Venue:** Fill out a form with venue name, address, city, province, coordinates, website, social links, phone, and amenities. The venue is created immediately.
- **Claim Existing Venue:** Search for a curated/unclaimed venue by name and submit an ownership claim. The claim goes through admin review. The owner must wait for approval before proceeding to courts.

### Step 3: Add Courts — Required

Select a sport, enter a court label, optionally set a tier label. The venue is pre-selected if there is only one. At least one active court must exist to proceed.

If the user chose the claim path and the claim is still pending, this step is blocked.

### Step 4: Schedule & Pricing — Skippable

Configure operating hours per day of the week with time blocks and hourly rates. Optionally configure add-ons (extras players can purchase). Both schedule and pricing must be saved for the court to be considered "ready."

### Step 5: Payment Method — Skippable

Add at least one organization payment method (mobile wallet or bank). The first active method can be set as default for player payment instructions.

### Step 6: Venue Verification — Skippable

Upload proof-of-ownership documents. Submission goes through asynchronous admin review. The owner sees "PENDING" status and can continue setup while waiting.

### Step 7: Complete — Terminal

Celebration screen with two options: Import Bookings (optional CSV import) or Go to Dashboard. No automatic redirect.

## What Makes Setup "Complete"?

All of the following must be true:

- Organization exists
- At least one venue exists
- Venue is verified (admin approved)
- At least one court is "ready" (has both schedule and pricing)
- At least one payment method is active

## Auto-Skip Behavior

When a user enters the wizard at step 1 and that step is already complete, the wizard automatically jumps forward to the first incomplete step. This fires once per session to prevent loops.

## Hub View (Non-Linear Alternative)

The hub displays the same tasks as individual cards: Create Organization, Add Venue, Claim Listing, Configure Courts, Payment Method Reminder, Verify Venue, Import Bookings, and a Setup Complete banner. Each card opens an overlay for that specific task.

## What Happens After Setup

After completing the wizard:

- The "Get Started" nav item disappears
- The owner lands on the booking management dashboard
- There is **no prompt to invite team members**
- There is **no in-wizard notification activation step** (dashboard warning exists later if zero recipients are enabled)
- There is **no guided "next steps" experience**
- There is **no "your venue is live" celebration email or banner**
- There is **no clarity on when the venue becomes visible to players**
