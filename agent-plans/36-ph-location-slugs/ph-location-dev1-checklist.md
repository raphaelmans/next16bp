# Developer 1 Checklist

**Focus Area:** PH location slugs + discovery filters

---

## Module 1A: Enriched JSON Generator

- [ ] Create `scripts/generate-ph-location-slugs.ts`
- [ ] Merge NCR + Taguig/Pateros into Metro Manila
- [ ] Generate enriched + minified JSON outputs

## Module 1B: API + Client Schema Updates

- [ ] Update `/api/public/ph-provinces-cities` to read enriched file
- [ ] Update Zod schema for enriched response

## Module 2A: Filters + Forms Consume Slugs

- [ ] Add shared helpers for slug lookup + options
- [ ] Update discovery filters + admin/owner forms

## Module 2B: Slug → Canonical Mapping

- [ ] Map slugs to canonical names before backend queries

## Module 3A: Popular Locations + Discovery URLs

- [ ] Update popular locations list
- [ ] Ensure header labels use display names

---

## Final Checklist

- [ ] Slug-based URLs working
- [ ] Enriched JSON generated
- [ ] `pnpm build` passes
