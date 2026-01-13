# Phase 2: Backend APIs + Security

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial (method management and reservation endpoint can be built in parallel)  
**User Stories:** US-15-01, US-15-02, US-15-03, US-15-04, US-15-05

---

## Objective

Provide owner-only CRUD for organization payment methods (including default method), and provide a **reservation-scoped** player query to retrieve payment methods for the payment page.

Eliminate payment detail exposure from public endpoints.

---

## Modules

### Module 2A: Organization Payment Methods (Owner)

**User Stories:** `US-15-01`, `US-15-02`

#### API Endpoints (tRPC)

| Endpoint | Type | Input | Output |
|----------|------|-------|--------|
| `organizationPayment.method.list` | Query | `{ organizationId: uuid }` | `{ methods: PaymentMethod[] }` |
| `organizationPayment.method.create` | Mutation | `{ organizationId, type, provider, accountName, accountNumber, instructions?, isDefault? }` | `{ method: PaymentMethod }` |
| `organizationPayment.method.update` | Mutation | `{ paymentMethodId, ...fields }` | `{ method: PaymentMethod }` |
| `organizationPayment.method.delete` | Mutation | `{ paymentMethodId }` | `{ success: true }` |
| `organizationPayment.method.setDefault` | Mutation | `{ paymentMethodId }` | `{ success: true }` |

#### Access Control

- Must verify caller is the organization owner.
- Only owner can create/update/delete/setDefault.

#### Business Rules

- At most one default method per org.
- Prevent setting default on inactive method.
- Deleting the default triggers fallback behavior (either require a new default or auto-select next active).

---

### Module 2B: Reservation Payment Info (Player)

**User Stories:** `US-15-03`, `US-15-04`

#### API Endpoint (tRPC)

| Endpoint | Type | Input | Output |
|----------|------|-------|--------|
| `reservation.getPaymentInfo` | Query | `{ reservationId: uuid }` | `{ methods: PaymentMethodPublic[], defaultMethodId: uuid|null, expiresAt: string|null }` |

#### Authorization Model

- Only the reservation owner (player) can fetch payment info.
- Only return payment info for payment-relevant statuses (e.g., `AWAITING_PAYMENT`, optionally `PAYMENT_MARKED_BY_USER`).

#### Output Shape (public-safe)

- Do not return internal org identifiers unless needed.
- Return only what the payment page needs:
  - provider label
  - account name
  - account number
  - method instructions
  - default indicator

---

## Security Hardening

### Remove public leakage

Current risk: payment details are derivable from a **public** endpoint (`timeSlot.getById`).

Actions:
- Ensure no public endpoint returns payment account numbers.
- Move payment detail reads to `reservation.getPaymentInfo` only.

---

## Validation Checklist

- [ ] Owner-only endpoints reject non-owners.
- [ ] Reservation payment info rejects non-owners.
- [ ] Public slot queries return no payment details.
- [ ] Default method invariant holds.
