# Phase 2: Backend Delete API

**Dependencies:** Phase 1 complete  
**Parallelizable:** No  
**User Stories:** US-02-09

---

## Objective

Add a place deletion mutation that validates ownership, deletes the place record, and relies on DB cascades / FK nulling for related records.

---

## Modules

### Module 2A: Place Delete Mutation

**User Story:** `US-02-09`  
**Reference:** `52-00-overview.md`

#### Directory Structure

```
src/modules/place/
├── dtos/place.dto.ts
├── repositories/place.repository.ts
├── services/place-management.service.ts
└── place-management.router.ts
```

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `placeManagement.delete` | Mutation | `{ placeId: string }` | `{ success: true }` |

#### Implementation Steps

1. Add `DeletePlaceSchema` + `DeletePlaceDTO` to `place.dto.ts`.
2. Add `delete` to `IPlaceRepository` and implement it in `PlaceRepository`.
3. Add `deletePlace` to `PlaceManagementService` with ownership checks and logging.
4. Expose `placeManagement.delete` in the tRPC router with standard error handling.

#### Flow Diagram

```
Owner UI ── deletePlace ──> PlaceManagementService
    │                            │
    │                            ▼
    └──── success toast <── repository.delete(place)
```

#### Testing Checklist

- [ ] `pnpm lint`
- [ ] `pnpm build`

---

## Phase Completion Checklist

- [ ] Delete DTO added
- [ ] Repository + service + router updated
- [ ] Logs emitted for `place.deleted`
