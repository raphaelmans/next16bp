# US-02-03: Admin Data Entry Form for Curated Courts

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -  
**Related:** US-02-01 (Admin Creates Curated Court), US-02-04 (CSV Import Script)

---

## Story

As an **admin or data entry staff**, I want to **quickly add curated court listings via a simple web form** so that **I can efficiently populate the platform with court inventory**.

---

## Overview

A minimal, functional data entry form at `/admin/courts/data-entry` optimized for rapid manual entry. Uses modular admin-specific components that can be reused across other admin forms.

---

## Acceptance Criteria

### Access Form

- Given I am an admin on `/admin/courts`
- When I click "Data Entry"
- Then I navigate to `/admin/courts/data-entry`

### Create Court

- Given I am on `/admin/courts/data-entry`
- When I fill required fields (name, address, city) and submit
- Then a court is created with `type: CURATED`, `claimStatus: UNCLAIMED`
- And I see a success toast

### Optional Coordinates

- Given I am creating a court
- When I leave latitude/longitude empty
- Then the court is created with default coordinates ("14.5995", "120.9842" - Manila center)

### Create Another Flow

- Given I successfully created a court
- When I click "Create Another"
- Then the form clears and I can enter a new court
- And I remain on `/admin/courts/data-entry`

### Back to List

- Given I successfully created a court
- When I click "Back to Courts"
- Then I navigate to `/admin/courts`

### Validation

- Given I submit with missing required fields
- Then I see inline validation errors
- And the form is not submitted

### Real API Integration

- Given I submit the form
- When the mutation executes
- Then it calls `admin.court.createCurated` tRPC endpoint (not mock data)

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Missing required field | Show inline validation error |
| Invalid URL format | Show validation error |
| Network error | Show error toast, preserve form state |
| Duplicate court name | Allow (not a unique constraint) |
| Empty lat/lng | Use default Manila coordinates |

---

## Form Fields

### Required

| Field | Type | Component | Validation |
|-------|------|-----------|------------|
| Name | text | `AdminInput` | 1-200 chars |
| Address | text | `AdminInput` | 1+ chars |
| City | select | `AdminSelect` | From predefined list |

### Optional - Location

| Field | Type | Component | Validation |
|-------|------|-----------|------------|
| Latitude | text | `AdminInput` | Valid decimal or empty |
| Longitude | text | `AdminInput` | Valid decimal or empty |

### Optional - Contact

| Field | Type | Component | Validation |
|-------|------|-----------|------------|
| Facebook URL | text | `AdminInput` | Valid URL or empty |
| Instagram URL | text | `AdminInput` | Valid URL or empty |
| Viber Contact | text | `AdminInput` | Max 100 chars |
| Website URL | text | `AdminInput` | Valid URL or empty |
| Other Contact Info | textarea | `AdminTextarea` | Free text |

### Optional - Amenities

| Field | Type | Component | Validation |
|-------|------|-----------|------------|
| Amenities | multi-checkbox | `AdminCheckboxGroup` | From predefined list |

---

## Predefined Lists

### Cities

```typescript
const CITIES = [
  "Makati", "BGC", "Pasig", "Quezon City", "Manila", "Taguig", 
  "Mandaluyong", "San Juan", "Parañaque", "Las Piñas", "Muntinlupa", "Alabang"
];
```

### Amenities

```typescript
const AMENITIES = [
  "Parking", "Restrooms", "Lights", "Showers", "Locker Rooms", 
  "Equipment Rental", "Pro Shop", "Seating Area", "Food/Drinks", 
  "WiFi", "Air Conditioning", "Covered Courts"
];
```

---

## UI Requirements

- Single-page form layout (no cards/sections like existing form)
- Minimal styling, functional focus
- Form sections separated by simple spacing, not card containers
- Success state shows: court name created + action buttons

### Success State UI

```
+------------------------------------------+
|  Court created successfully!             |
|  "Makati Pickleball Club"                |
|                                          |
|  [Create Another]  [Back to Courts]      |
+------------------------------------------+
```

---

## Component Architecture

### New Admin Components (Modular)

All components should be simple wrappers that can be reused across admin forms.

#### `AdminInput`

```typescript
interface AdminInputProps {
  label: string;
  name: string;
  type?: "text" | "url" | "number";
  placeholder?: string;
  required?: boolean;
  error?: string;
  // Standard input props
}
```

#### `AdminSelect`

```typescript
interface AdminSelectProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  error?: string;
}
```

#### `AdminTextarea`

```typescript
interface AdminTextareaProps {
  label: string;
  name: string;
  rows?: number;
  placeholder?: string;
  error?: string;
}
```

#### `AdminCheckboxGroup`

```typescript
interface AdminCheckboxGroupProps {
  label: string;
  name: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}
```

#### `AdminFormActions`

```typescript
interface AdminFormActionsProps {
  submitLabel: string;
  isSubmitting: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
}
```

#### `AdminSuccessState`

```typescript
interface AdminSuccessStateProps {
  title: string;
  message: string;
  actions: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  }[];
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/features/admin/components/admin-input.tsx` | Simple labeled input |
| `src/features/admin/components/admin-select.tsx` | Simple labeled select |
| `src/features/admin/components/admin-textarea.tsx` | Simple labeled textarea |
| `src/features/admin/components/admin-checkbox-group.tsx` | Checkbox group for multi-select |
| `src/features/admin/components/admin-form-actions.tsx` | Submit/cancel buttons |
| `src/features/admin/components/admin-success-state.tsx` | Success message with actions |
| `src/features/admin/components/admin-curated-court-form.tsx` | Data entry form component |
| `src/features/admin/schemas/curated-court-data-entry.schema.ts` | Simplified form schema |
| `src/app/(admin)/admin/courts/data-entry/page.tsx` | Data entry page |

## Files to Modify

| File | Change |
|------|--------|
| `src/features/admin/hooks/use-admin-courts.ts` | Wire `useCreateCuratedCourt` to real tRPC API |
| `src/features/admin/components/index.ts` | Export new admin components |
| `src/app/(admin)/admin/courts/page.tsx` | Add "Data Entry" button next to existing "Add Curated Court" |

---

## API Integration

### Hook Changes

Current `useCreateCuratedCourt` uses mock data:

```typescript
// BEFORE (mock)
export function useCreateCuratedCourt() {
  return useMutation({
    mutationFn: async (data: CuratedCourtData) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, courtId: `court-new-${Date.now()}` };
    },
    // ...
  });
}
```

Should call real API:

```typescript
// AFTER (real)
import { trpc } from "@/shared/lib/trpc/client";

export function useCreateCuratedCourt() {
  const utils = trpc.useUtils();
  
  return trpc.admin.court.createCurated.useMutation({
    onSuccess: () => {
      utils.admin.court.list.invalidate();
    },
  });
}
```

### Schema Transformation

Form schema allows empty lat/lng, but API requires them. Transform in mutation:

```typescript
const handleSubmit = (data: FormData) => {
  createMutation.mutate({
    ...data,
    latitude: data.latitude || "14.5995",  // Default to Manila
    longitude: data.longitude || "120.9842",
  });
};
```

---

## Testing Checklist

- [ ] Form renders with all fields
- [ ] Required field validation works
- [ ] URL validation works for contact fields
- [ ] City select shows all predefined cities
- [ ] Amenities checkboxes work correctly
- [ ] Submit calls real API
- [ ] Success state shows after creation
- [ ] "Create Another" clears form
- [ ] "Back to Courts" navigates correctly
- [ ] Error toast shows on API failure
- [ ] Form preserves state on error

---

## Future Considerations

### Edit Flow (US-02-05)

The edit form at `/admin/courts/[id]/edit` should:
- Reuse the same admin components
- Include a photo upload placeholder (disabled/coming soon)
- Pre-populate form with existing court data

### Batch Operations

Future enhancement could add:
- Multi-select in courts list
- Bulk deactivate/activate
- Bulk delete

---

## References

- PRD: Section 5.2 (Curated Courts)
- Existing form: `src/app/(admin)/admin/courts/new/page.tsx`
- API endpoint: `src/modules/court/admin/admin-court.router.ts`
- Schema: `src/modules/court/dtos/create-curated-court.dto.ts`
