
**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** N/A (contact info enhancement)

---

## Objective

Add Phone Number inputs across owner/admin forms and expose actionable, copyable contact actions on public place detail pages. Use `type="tel"` and PH `09` placeholders for mobile-friendly input.

---

## Module 2A: Phone input + actionable contact UI

**Reference:** `50-00-overview.md`

### Form Fields

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| phoneNumber | tel | No | max 20 chars | Placeholder `0917 123 4567` |
| viberInfo | tel | No | max 100 chars | Placeholder `0917 123 4567` |

### UI Layout

```
Contact Information
┌─────────────────────────────┬─────────────────────────────┐
│ Phone Number                │ Viber Number                │
│ 0917 123 4567               │ 0917 123 4567               │
└─────────────────────────────┴─────────────────────────────┘

Public Contact Card
┌───────────────────────────────────────────────────────────┐
│ Contact                                                   │
│ [Call 0917 123 4567]  [Copy]                              │
│ [Viber 0917 123 4567] [Copy]                              │
│ Website / Facebook / Instagram links                      │
└───────────────────────────────────────────────────────────┘
```

### Flow Diagram

```
Form submit
    │
    ▼
phoneNumber -> mutation -> upsertContactDetail
    │
    ▼
Public detail renders buttons + copy
```

### Implementation Steps

1. Add `phoneNumber` to owner/admin form schemas and default values.
2. Add phone input beside Viber in:
   - `src/features/owner/components/place-form.tsx`
   - `src/app/(admin)/admin/courts/new/page.tsx`
   - `src/app/(admin)/admin/courts/[id]/page.tsx`
   - `src/app/(admin)/admin/courts/batch/page.tsx`
3. Update mutation payloads to include `phoneNumber`.
4. Extend discovery contact mapping to include `phoneNumber`.
5. Public detail contact card:
   - Add `tel:` button for phone.
   - Add Viber button with normalized `+63` link.
   - Add copy buttons using `copyToClipboard`.
6. Add helper `src/shared/lib/phone.ts` to normalize PH numbers for links.

### Code Example

```ts
export const normalizePhMobile = (value: string) => {
  const digits = value.replace(/[^\d+]/g, "");
  if (digits.startsWith("09") && digits.length >= 11) {
    return `+63${digits.slice(1)}`;
  }
  if (digits.startsWith("63") && !digits.startsWith("+")) {
    return `+${digits}`;
  }
  return digits;
};
```

### Testing Checklist

- [ ] Phone input renders on owner and admin forms with tel keyboard.
- [ ] Phone number persists on create/update.
- [ ] Public detail shows Call + Viber buttons when values exist.
- [ ] Copy buttons copy the visible number.
- [ ] Lint/build pass.

---

## Phase Completion Checklist

- [ ] Forms updated with phone inputs.
- [ ] Public contact UI actionable + copyable.
- [ ] Lint/build pass.
