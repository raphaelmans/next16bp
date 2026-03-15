# Phase 4: Batch Curated Court Entry

**Dependencies:** Phase 2 (Data Entry Form) complete  
**Parallelizable:** Partial (4A before 4B)  
**User Stories:** US-02-07

---

## Objective

Add a batch admin portal for creating multiple curated courts in a single submission, with per-row validation, duplicate skipping, and full metadata support.

---

## Modules

### Module 4A: Batch Create API

**User Story:** `US-02-07`

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `admin.court.createCuratedBatch` | Mutation | `{ items: CreateCuratedCourt[] }` | `{ summary, items }` |

#### Output Contract

```ts
{
  summary: {
    total: number;
    created: number;
    skipped: number;
    failed: number;
  };
  items: Array<{
    index: number;
    status: "created" | "skipped_duplicate" | "error";
    placeId?: string;
    message?: string;
  }>;
}
```

#### Implementation Steps

1. Create `CreateCuratedCourtBatchSchema` DTO (array input)
2. Add `admin.court.createCuratedBatch` tRPC mutation
3. Add repository duplicate check by name + city
4. Implement service method to:
   - Skip duplicates (existing + within batch)
   - Create curated place + details + amenities + photos
   - Return per-row results and summary counts

---

### Module 4B: Batch Entry Admin Page

**User Story:** `US-02-07`

#### Route

```
/admin/courts/batch
```

#### Form Fields (per row)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Name | text | Yes | 1-200 chars |
| Address | text | Yes | 1+ chars |
| City | select | Yes | From predefined list |
| Latitude | text | No | Valid decimal or empty |
| Longitude | text | No | Valid decimal or empty |
| Facebook URL | text | No | URL or empty |
| Instagram URL | text | No | URL or empty |
| Viber Contact | text | No | Max 100 chars |
| Website URL | text | No | URL or empty |
| Other Contact Info | textarea | No | Max 500 chars |
| Amenities | multi-checkbox | No | From predefined list |
| Photo URLs | multiline text | No | URL per line or comma |

#### UI Layout

```
┌────────────────────────────────────────────────────────┐
│ Batch Curated Courts                                   │
│ [Add Row]                               [Submit Batch] │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Court 1                                            │ │
│ │ Name, Address, City, Lat/Lng                       │ │
│ │ Contact info fields                                │ │
│ │ Amenities checkboxes                               │ │
│ │ Photo URLs textarea                                │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ Results summary + per-row status                       │
└────────────────────────────────────────────────────────┘
```

#### Implementation Steps

1. Create `curated-court-batch.schema.ts` for batch form validation
2. Build `/admin/courts/batch` page with add/remove row UI
3. Add `useCreateCuratedCourtsBatch` hook using tRPC mutation
4. Render results summary for created/skipped/failed rows
5. Add "Batch Add" button in admin courts list

---

## Phase Completion Checklist

- [ ] Batch endpoint creates curated places and skips duplicates
- [ ] Batch admin page submits multiple rows correctly
- [ ] Results summary shows created/skipped/failed counts
- [ ] Build passes with no TypeScript errors
