# Developer 1 Checklist

**Focus Area:** PH location data + place form integration  
**Modules:** 1A, 2A

---

## Module 1A: PH Dataset + Cached API Route

**Reference:** `34-01-ph-address-data.md`  
**User Story:** `US-14-06`

### Setup

- [ ] Copy `philippines-addresses.json` into `public/assets/files/`
- [ ] Generate `ph-provinces-cities.json` (province → cities)

### Implementation

- [ ] Create `/api/public/ph-provinces-cities` cached route
- [ ] Normalize and sort provinces/cities in response
- [ ] Add cache headers (immutable)

### Testing

- [ ] `CEBU` includes `CEBU CITY`
- [ ] Response is stable and cached

---

## Module 2A: Place Form Dropdowns + Country Lock

**Reference:** `34-02-place-form-enforcement.md`  
**User Story:** `US-14-06`

### Setup

- [ ] Add PH provinces/cities client hook
- [ ] Wire query into owner `PlaceForm`

### Implementation

- [ ] Replace free-text province/city with selects
- [ ] Reset city when province changes
- [ ] Disable country select with `PH` default

### Testing

- [ ] Province/city options render correctly
- [ ] Country stays locked to `PH`

---

## Final Checklist

- [ ] All tasks complete
- [ ] No TypeScript errors
- [ ] `pnpm lint` + `pnpm build` pass
