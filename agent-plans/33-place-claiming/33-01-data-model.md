# Phase 1: Data Model + API Contracts

**Dependencies:** Existing claim-request + place discovery modules

**Parallelizable:** Partial (1A before 1B/1C)  
**User Stories:** US-17-02, US-17-04, US-17-05

---

## Objective

Make place contact information a first-class, place-scoped concept across both curated and reservable places, and update the place details response shape to avoid type overloading.

---

## Modules

### Module 1A: Rename Curated Detail → Place Contact Detail

**User Stories:** `US-17-02`, `US-17-05`

#### Data Model

- Replace `curated_place_detail` with `place_contact_detail`
- Preserve the same columns:
  - `facebook_url`, `instagram_url`, `website_url`, `viber_info`, `other_contact_info`
- Keep `place_id` unique FK to `place(id)`

#### Drizzle Schema Changes

- Update `src/shared/infra/db/schema/place.ts`
  - Rename exported table from `curatedPlaceDetail` to `placeContactDetail`
  - Rename types accordingly

#### Notes

- The environment will be reset, so no data migration is required.

---

### Module 1B: Place Details Response Shape

**User Stories:** `US-17-02`, `US-17-05`

#### Problem

`PlaceRepository.findWithDetails()` currently returns a union `detail` field which can contain either curated detail or organization reservation policy depending on place type.

#### Change

Update repository/service contracts to return separate fields:

```ts
{
  place,
  contactDetail: PlaceContactDetail | null,
  reservationPolicy: OrganizationReservationPolicy | null,
  photos,
  amenities,
}
```

#### Impacted Modules

- `src/modules/place/repositories/place.repository.ts`
- `src/modules/place/services/place-discovery.service.ts`
- `src/modules/place/services/place-management.service.ts`

---

### Module 1C: Claim Approval Preserves Contact Detail

**User Stories:** `US-17-04`

#### Behavior

On approve:
- Place becomes reservable
- Place is assigned to the organization
- Contact detail is preserved (no deletion)

#### Impacted Modules

- `src/modules/claim-request/use-cases/approve-claim-request.use-case.ts`

---

## Testing Checklist

- [ ] Public place detail still loads for reservable places.
- [ ] Public place detail loads for curated places and includes contact detail.
- [ ] Owner place edit still loads and enforces ownership.
- [ ] Admin claim approval still succeeds.
