# Developer 1 Checklist

**Focus Area:** Public navbar consistency  
**Modules:** 1A, 1B

---

## Module 1A: URL query builder foundation

**Reference:** `39-01-public-navbar-consistency.md`  
**User Story:** `US-11-01`  
**Dependencies:** None

### Setup

- [ ] Add `src/shared/lib/url-query-builder.ts` with `URLQueryBuilder` and `QueryParamRecord`.

### Implementation

- [ ] Match existing helper behavior: skip falsy values, expose `build`, `buildWithStartQuery`, `buildWholeUrl`.
- [ ] Export `QueryParamRecord` for reuse.

### Testing

- [ ] Types compile in any new consumers.

---

## Module 1B: Navbar search routing updates

**Reference:** `39-01-public-navbar-consistency.md`  
**User Story:** `US-11-01`  
**Dependencies:** Module 1A

### Setup

- [ ] Update `src/features/discovery/components/navbar.tsx` logo link to `/`.
- [ ] Convert search forms to GET with `action` and `name="q"`.

### Implementation

- [ ] Use `URLQueryBuilder` to build `/courts?q=...` query string.
- [ ] Reset to `/courts` on empty query.
- [ ] Close mobile sheet on search submit.

### Testing

- [ ] From `/courts/[id]`, search routes to `/courts?q=...`.
- [ ] From any public route, logo routes to `/`.

---

## Final Checklist

- [ ] All tasks complete
- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
