
**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** US-17-06

---

## Objective

Add an ownership panel and transfer dialog to the admin courts detail page so admins can assign places to organizations and share owner links during onboarding.

---

## Modules

### Module 2A: Ownership Card + Transfer Dialog

**User Story:** `US-17-06`  
**Reference:** `51-00-overview.md`

#### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Organization | search select | Yes | Must be a valid organization id |
| Auto-verify & enable | checkbox | Yes | Defaults to true |

#### UI Layout

```
+-----------------------------------------------+
| Ownership & Transfer                           |
| Current organization + status badges           |
| [Transfer] [Copy owner link]                   |
+-----------------------------------------------+

+-----------------------------------------------+
| Transfer dialog                                |
| Organization picker (search)                   |
| [x] Auto-verify + enable reservations          |
| [Cancel]                        [Transfer]     |
+-----------------------------------------------+
```

#### Implementation Steps

1. Add ownership card above the admin court edit form.
2. Use `trpc.admin.organization.search` for the organization picker.
3. Wire transfer mutation with optimistic disabling and toasts.
4. Add copy owner link action (login redirect to owner edit page).
5. Refresh admin court detail and list on success.

#### Testing Checklist

- [ ] Ownership card shows current org, place type, and claim status
- [ ] Organization search returns results as you type
- [ ] Transfer mutation is disabled without a selection
- [ ] Auto-verify toggle is respected
- [ ] Owner link copies to clipboard

---

## Phase Completion Checklist

- [ ] Transfer dialog available on admin court detail
- [ ] Organization picker uses admin search API
- [ ] Success/failure toasts are shown appropriately
- [ ] No TypeScript errors
