# Phase 4: Discovery Improvements

**Dependencies:** Plans 39, 35/36, 42  
**Parallelizable:** Partial

---

## Objective

Increase landing → discovery → detail conversion by improving discovery relevance and keeping routing consistent.

---

## Modules

### Module 4A: Amenities filter on /courts

Reference:
- `agent-plans/42-amenities-discovery-filters/`

Acceptance:
- [ ] Amenities appears as the first filter.
- [ ] URL includes `amenities` array param.
- [ ] Discovery results respect AND semantics.

---

### Module 4B: Landing routing consistency

Reference:
- `agent-plans/39-public-navbar-consistency/`
- `agent-plans/35-courts-discovery-filters/`
- `agent-plans/36-ph-location-slugs/`

Acceptance:
- [ ] Landing search routes to `/courts?q=...`.
- [ ] Popular locations use slug-based `province` + `city`.
- [ ] Header labels derive from display names.
