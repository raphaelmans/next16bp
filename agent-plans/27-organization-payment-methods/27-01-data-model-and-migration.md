# Phase 1: Data Model + Migration

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-15-01, US-15-02, US-15-05

---

## Objective

Introduce organization-scoped tables for:
- reservation policy defaults (not editable in UI yet)
- payment methods (wallet/bank) with per-method instructions and default

Provide a clear migration/removal path from `reservable_place_policy`.

---

## Schema

### Table: `organization_reservation_policy` (1:1)

**Purpose:** Replace place-scoped policy fields used for TTLs and cancellation cutoffs.

Fields:
- `organization_id` (FK, unique)
- `requires_owner_confirmation` (bool, default true)
- `payment_hold_minutes` (int, default 15)
- `owner_review_minutes` (int, default 15)
- `cancellation_cutoff_minutes` (int, default 0)
- timestamps

### Table: `organization_payment_method` (1:N)

**Purpose:** Store payment rails + account details + per-method instructions.

Fields:
- `id` (uuid)
- `organization_id` (FK)
- `type` enum: `MOBILE_WALLET | BANK`
- `provider` enum (PH-only constants; separate wallet/bank providers allowed)
- `account_name` (required)
- `account_number` (required)
- `instructions` (nullable text)
- `is_active` (bool default true)
- `is_default` (bool default false)
- `display_order` (int default 0)
- timestamps

### Constraints

- Prevent duplicates: unique constraint on `(organization_id, provider, account_number)`.
- Single default per org: partial unique index on `(organization_id) WHERE is_default = true`.

---

## Data Lifecycle

### Record creation

- Policy defaults should exist for every organization.
- Strategy: create policy on organization creation, or lazily create on first read (recommended: lazy repair + migration for existing orgs).

### Default method

- If no default exists and one or more methods exist:
  - either require the owner to pick one, or auto-promote the first active method.
  - prefer deterministic auto-promote as a safety net.

---

## Migration Strategy

### Option A (no production data / safe to break)

- Create new tables.
- Update code to use org tables.
- Drop `reservable_place_policy` in the same change.

### Option B (production data exists)

- Step 1: Create new tables.
- Step 2: Backfill:
  - For each organization with at least one claimed place, derive policy defaults:
    - use existing `reservable_place_policy` values if present, else defaults.
  - Derive payment methods from existing place policy fields:
    - if `gcashNumber` present → create MOBILE_WALLET provider=GCASH
    - if `bankAccountNumber` present → create BANK provider=<bank name mapping>
    - map `bankAccountName` to `account_name`
    - map `paymentInstructions` to per-method `instructions` (or split if desired)
- Step 3: Switch reads/writes.
- Step 4: Drop legacy table.

---

## Validation Checklist

- [ ] Migration applies cleanly.
- [ ] Default policy values present for existing orgs.
- [ ] Unique constraints behave as expected.
