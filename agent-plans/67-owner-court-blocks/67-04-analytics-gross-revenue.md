# Phase 4: Analytics - Gross Revenue (Reservations + Walk-Ins)

**Dependencies:** Phase 2 complete  
**Parallelizable:** Yes  
**User Stories:** US-05-04 (analytics requirement)

---

## Objective

Expose gross revenue numbers for owners by combining:
- Confirmed reservations
- Walk-in booking blocks (price snapshots)

---

## Definitions (v1)

- Gross revenue = sum of amounts charged.
- No platform fees/commissions in v1.

---

## Data Sources

### Reservations

- Include only `reservation.status = 'CONFIRMED'`.
- Use `reservation.total_price_cents` + `reservation.currency`.

### Walk-ins

- Include only `court_block.type = 'WALK_IN'` and `is_active = true`.
- Use `court_block.total_price_cents` + `court_block.currency`.

---

## Proposed Endpoint

Add an owner-only analytics router (or attach to existing owner dashboard router if present):

| Procedure | Type | Input | Output |
|----------|------|-------|--------|
| `ownerAnalytics.getGrossRevenueForCourtRange` | Query | `{ courtId, startTime, endTime }` | `{ totalCents, currency, byDay?: [...] }` |

---

## Deferred

- Multi-currency rollups
- Net payout / fees
- Refunds / partial cancellations
