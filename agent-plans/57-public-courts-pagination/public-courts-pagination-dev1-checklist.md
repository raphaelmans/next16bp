# Developer 1 Checklist

**Focus Area:** Public discovery pagination UX

---

## Module 1A: Public courts pagination UI

**Reference:** `agent-plans/57-public-courts-pagination/57-01-public-courts-pagination.md`

### Implementation

- [ ] Update `src/app/(public)/courts/page.tsx` to remove "Load more"
- [ ] Add shadcn pagination components from `src/components/ui/pagination.tsx`
- [ ] Render pagination only in list view (`filters.view === "list"`)
- [ ] Add "Showing X-Y of Z" label
- [ ] Ensure disabled previous/next states match existing admin pattern

### Polish

- [ ] Implement condensed page list + ellipsis
- [ ] Confirm spacing aligns with design system (bento grid rhythm)

### Validation

- [ ] `pnpm lint`
- [ ] `pnpm build`
