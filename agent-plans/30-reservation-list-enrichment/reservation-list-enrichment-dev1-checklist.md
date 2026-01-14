# Developer 1 Checklist

**Focus Area:** Backend enrichment + frontend wiring  
**Modules:** 1A, 1B, 2A, 2B

---

## Module 1A: Repository + DTOs

**Reference:** `30-01-backend-list-endpoint.md`  
**User Story:** `US-16-01`

### Setup

- [ ] Add reservation list DTO schema and exports

### Implementation

- [ ] Add repository query for player list with joins
- [ ] Aggregate slot time and pricing details
- [ ] Select first place photo URL

### Testing

- [ ] Confirm multi-slot aggregation with sample data

---

## Module 1B: Service + Router Endpoint

**Reference:** `30-01-backend-list-endpoint.md`  
**User Story:** `US-16-01`

### Implementation

- [ ] Add `getMyWithDetails` endpoint
- [ ] Wire service method to repository query

### Testing

- [ ] Endpoint returns only player-owned reservations

---

## Module 2A: Reservation list hook + UI

**Reference:** `30-02-frontend-wiring.md`  
**User Story:** `US-16-01`

### Implementation

- [ ] Replace placeholders in `useMyReservations`
- [ ] Map real court/address/slot data
- [ ] Invalidate `getMyWithDetails` caches on mutations

---

## Module 2B: Home summary wiring

**Reference:** `30-02-frontend-wiring.md`  
**User Story:** `US-16-02`

### Implementation

- [ ] Use `getMyWithDetails` in `useHomeData`
- [ ] Map home summary to real court details

---

## Final Checklist

- [ ] `pnpm lint` passes
- [ ] `TZ=UTC pnpm build` passes
- [ ] Update context tables if needed
