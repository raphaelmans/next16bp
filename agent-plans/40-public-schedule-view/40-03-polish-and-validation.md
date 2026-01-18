# Phase 3: Polish + Validation

**Dependencies:** Phases 1-2 complete
**Parallelizable:** No

---

## Objective

Polish UI, ensure accessibility, and validate with lint/build.

---

## Tasks

### UI Polish

- Ensure responsive behavior:
  - Mobile: stacked layout; court lanes become collapsible/accordion.
  - Desktop: multi-lane scroll.

- Ensure loading states:
  - Skeletons or simple loading placeholders for per-court lanes.

### Accessibility

- Keyboard navigation for time slots (button elements).
- Ensure link/button accessible names.
- Ensure color is not the only indicator of selection.

### Validation

- Run `pnpm lint`
- Run `TZ=UTC pnpm build`

---

## Completion Checklist

- [ ] No TypeScript errors
- [ ] Biome passes
- [ ] Next build passes in UTC
