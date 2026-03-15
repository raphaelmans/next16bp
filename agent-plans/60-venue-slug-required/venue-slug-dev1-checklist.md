# Developer 1 Checklist

**Focus Area:** Slug enforcement + owner UI cleanup  
**Modules:** 1A, 1B

---

## Module 1A: DB + Backend Enforcement

**Reference:** `60-01-slug-enforcement.md`

### Setup

- [ ] Update `src/shared/infra/db/schema/place.ts` to make `slug` required
- [ ] Remove partial unique index filter on `uq_place_slug`

### Implementation

- [ ] Remove `slug` from place create/update DTOs
- [ ] Always derive slug from venue name in create/update service
- [ ] Regenerate slug on name change

### Testing

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`

---

## Module 1B: Owner UI + DTO Cleanup

**Reference:** `60-01-slug-enforcement.md`

### Implementation

- [ ] Remove `slug` from owner form schema
- [ ] Remove slug input + slug preview from owner form UI
- [ ] Stop sending slug in owner form submission payloads
- [ ] Remove slug defaults from edit page

### Testing

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`

---

## Final Checklist

- [ ] Lint/build pass
- [ ] Manual sanity: create + rename venue updates slug
