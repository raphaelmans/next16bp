# Phase 1: Admin Batch Accordion

**Dependencies:** None  
**Parallelizable:** No  
**User Stories:** US-02-07

---

## Objective

Reduce scrolling friction by wrapping each batch item in an accordion and adding an "Add Row" button at the bottom of every batch item.

---

## Modules

### Module 1A: Admin batch row accordion + add button

**User Story:** `02-07-admin-batch-curated-courts`  
**Reference:** `38-00-overview.md`

#### Directory Structure

```
src/app/(admin)/admin/courts/batch/page.tsx
```

#### UI Layout

```
┌──────────────────────────────────────────────────┐
│ Courts in this batch       [Clear Batch][Add Row]│
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ ▼ Court 1                                    │ │
│ │   (Makati Pickleball Club)                   │ │
│ │ ┌──────────────────────────────────────────┐ │ │
│ │ │ Basic Information ...                    │ │ │
│ │ └──────────────────────────────────────────┘ │ │
│ │ ...                                          │ │
│ │ [Add Row Below]                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ ▶ Court 2                                    │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

#### Implementation Steps

1. Import accordion components from `@/components/ui/accordion`.
2. Update the batch `useFieldArray` to include `insert` and create `handleInsertCourtAfter` helper.
3. Wrap the batch rows list in an `Accordion` with `type="multiple"`.
4. Render each batch row as an `AccordionItem` using `field.id` for `value`.
5. Move the row header into `AccordionTrigger` and render the existing cards inside `AccordionContent`.
6. Add an "Add Row Below" button after the last card in each accordion content.

#### Testing Checklist

- [ ] Manual: create a new row from the bottom of a batch item
- [ ] Manual: ensure multiple accordion items can remain open
- [ ] Manual: submit batch with multiple rows

#### Handoff Notes

- None.

---

## Phase Completion Checklist

- [ ] Accordion renders for batch items
- [ ] "Add Row Below" button works per item
- [ ] No layout regressions in form
- [ ] No TypeScript errors
