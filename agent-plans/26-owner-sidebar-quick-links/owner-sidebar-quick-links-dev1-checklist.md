# Developer 1 Checklist

**Focus Area:** Owner sidebar quick links  
**Modules:** 1A, 1B

---

## Module 1A: Data Hook for Places + Courts

**Reference:** `26-01-owner-sidebar-quick-links.md`  
**User Story:** `US-11-01`  
**Dependencies:** None

### Setup

- [ ] Confirm `placeManagement` and `courtManagement` queries are available
- [ ] Identify organization context in owner sidebar

### Implementation

- [ ] Fetch places for organization
- [ ] Fetch courts per place with `trpc.useQueries`
- [ ] Filter to active courts only
- [ ] Sort courts by label for stable ordering

### Testing

- [ ] Verify loading state renders without layout shift

---

## Module 1B: Collapsible Sidebar Menu UI

**Reference:** `26-01-owner-sidebar-quick-links.md`  
**User Story:** `US-11-01`  
**Dependencies:** Module 1A

### Setup

- [ ] Import `Collapsible` components and sidebar sub-menu primitives

### Implementation

- [ ] Add Places quick-links group to owner sidebar
- [ ] Wire collapsible trigger with place name
- [ ] Render court links to slots page
- [ ] Show "No active courts" when needed
- [ ] Highlight active court link

### Testing

- [ ] Run `pnpm lint`
- [ ] Run `TZ=UTC pnpm build`

---

## Final Checklist

- [ ] Owner sidebar quick links visible
- [ ] Place toggles expand/collapse courts
- [ ] No console errors in sidebar render
- [ ] Success criteria checked in overview
