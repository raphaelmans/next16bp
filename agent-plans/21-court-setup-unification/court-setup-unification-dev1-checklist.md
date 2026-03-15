# Developer 1 Checklist

**Focus Area:** Owner court setup route unification  
**Modules:** 1A, 1B, 1C

---

## Module 1A: Unified setup page

**Reference:** `21-01-unified-setup-route.md`  
**User Story:** `US-14-07`

### Setup

- [ ] Review current setup + create pages
- [ ] Confirm nuqs query state patterns

### Implementation

- [ ] Add `courtId` + `step` query state
- [ ] Render create form when `courtId` missing
- [ ] Render wizard flow when `courtId` exists

### Testing

- [ ] Create court then land on `step=hours`
- [ ] Navigate Setup Wizard from courts list

---

## Module 1B: Route helpers + links

**Reference:** `21-01-unified-setup-route.md`  
**User Story:** `US-14-07`

### Implementation

- [ ] Update `appRoutes.owner.places.courts.setup`
- [ ] Update courts table links
- [ ] Update owner create redirect

---

## Module 1C: Legacy redirect

**Reference:** `21-01-unified-setup-route.md`  
**User Story:** `US-14-07`

### Implementation

- [ ] Replace legacy setup page with redirect

---

## Final Checklist

- [ ] `pnpm lint` passes
- [ ] `TZ=UTC pnpm build` passes
- [ ] QA links and redirects
