
**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** N/A (contact info enhancement)

---

## Objective

Expose `phoneNumber` as a first-class field for place contact details in all relevant DTOs and repository/service flows, keeping the DB column nullable and mapping empty strings to `null`.

---

## Module 1A: Place contact phone data

**Reference:** `50-00-overview.md`

### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `placeManagement.create` | Mutation | `phoneNumber?: string` | `PlaceRecord` |
| `placeManagement.update` | Mutation | `phoneNumber?: string` | `PlaceRecord` |
| `admin.court.createCurated` | Mutation | `phoneNumber?: string` | `CreatedCuratedPlace` |
| `admin.court.update` | Mutation | `phoneNumber?: string` | `AdminPlaceDetails` |
| `admin.court.createCuratedBatch` | Mutation | `items[].phoneNumber?: string` | `CuratedBatchResult` |
| `place.getById` | Query | `placeId` | `PlaceDetails` (includes `phoneNumber`) |

### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| phoneNumber | tel | No | max 20 chars |

### Implementation Steps

1. Add `phoneNumber` to `CreatePlaceSchema` and `UpdatePlaceSchema`.
2. Include `phoneNumber` in `placeRepository.upsertContactDetail` payloads.
3. Update admin curated court DTOs to include `phoneNumber`.
4. Persist `phoneNumber` via `adminCourtRepository.createCuratedDetail`/`updateCuratedDetail`.
5. Ensure discovery/service responses include `phoneNumber`.

### Code Example

```ts
await this.placeRepository.upsertContactDetail(
  {
    placeId,
    phoneNumber: data.phoneNumber ?? null,
    viberInfo: data.viberInfo ?? null,
    facebookUrl: data.facebookUrl ?? null,
    instagramUrl: data.instagramUrl ?? null,
    websiteUrl: data.websiteUrl ?? null,
    otherContactInfo: data.otherContactInfo ?? null,
  },
  ctx,
);
```

### Testing Checklist

- [ ] Create place with phone number saves `phone_number` in DB.
- [ ] Update place clears phone when empty string is submitted.
- [ ] Admin curated create/update persists phone number.
- [ ] `place.getById` returns `phoneNumber`.

---

## Phase Completion Checklist

- [ ] API accepts `phoneNumber` across create/update flows.
- [ ] Repository updates include `phoneNumber` mapping.
- [ ] Lint/build pass.
