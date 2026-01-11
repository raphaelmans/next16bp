# Phase 2: Owner Wizard + Edit Flow

**Dependencies:** Phase 1 complete  
**Parallelizable:** Yes  
**User Stories:** US-02-05, US-02-06

---

## Objective

Deliver a multi-step owner court setup wizard with nuqs-managed steps and provide a full edit flow that allows owners to update court details, payment configuration, and default pricing.

---

## Modules

### Module 2A: Court Setup Wizard (nuqs steps)

**User Story:** `US-02-05`  
**Reference:** `12-00-overview.md`

#### Directory Structure

```
src/features/owner/components/court-form.tsx
src/features/owner/hooks/use-court-form.ts
src/app/(owner)/owner/courts/new/page.tsx
```

#### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Name | text | Yes | 1-150 chars |
| Address | text | Yes | 1-200 chars |
| City | select | Yes | from list |
| Latitude | number | No | numeric |
| Longitude | number | No | numeric |
| Default Hourly Rate | number | No | min 0 |
| Currency | select | Yes | ISO-4217 |
| Payment Instructions | textarea | No | max 1000 |
| GCash Number | text | No | max 20 |
| Bank Name | text | No | max 100 |
| Bank Account Number | text | No | max 50 |
| Bank Account Name | text | No | max 150 |

#### UI Layout

```
┌─────────────────────────────────────────────┐
│  Create Court (Step 2 of 5)                 │
│  [Basic] [Location] [Photos] [Amenities]... │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ Step Content                           │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  [Cancel]  [Back]               [Next]      │
└─────────────────────────────────────────────┘
```

#### Flow Diagram

```
/owner/courts/new?step=basic
    │
    ▼
Next → /owner/courts/new?step=location
    │
    ▼
Final Step → createReservable → /owner/courts/[id]/slots
```

#### Implementation Steps

1. Replace tabs with step-based wizard UI and nuqs `step` query state.
2. Add step validation rules for required fields.
3. Submit via `courtManagement.createReservable` with full payload.
4. Keep cancel and draft actions accessible across steps.

#### Testing Checklist

- [ ] Step navigation updates query param
- [ ] Validation blocks Next when required fields missing
- [ ] Submit creates court and redirects to slots

---

### Module 2B: Court Edit Page + Update Flow

**User Story:** `US-02-06`  
**Reference:** `12-00-overview.md`

#### Directory Structure

```
src/app/(owner)/owner/courts/[id]/edit/page.tsx
src/features/owner/hooks/use-court-form.ts
```

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `courtManagement.getById` | Query | `{ courtId }` | `CourtWithDetails` |
| `courtManagement.update` | Mutation | `{ courtId, name?, address?, city?, lat?, lng? }` | `CourtRecord` |
| `courtManagement.updateDetail` | Mutation | `{ courtId, defaultPriceCents?, payment... }` | `ReservableCourtDetailRecord` |

#### Implementation Steps

1. Create edit route with loading + not-found states.
2. Map court detail response into form defaults.
3. Save updates via `update` and `updateDetail` mutations.
4. Show success toast and keep user on edit page.

#### Testing Checklist

- [ ] Edit page loads with pre-filled data
- [ ] Update saves base + payment details
- [ ] Default rate updates reflect in booking views

---

## Phase Completion Checklist

- [ ] Wizard flow uses nuqs step state
- [ ] Edit route exists and saves data
- [ ] No TypeScript errors
