# Phase 1: Owner Tabs + Accessibility

**Dependencies:** None  
**Parallelizable:** No  

---

## Objective

Replace the single `TabsContent` panel with per-tab panels so Radix Tabs have valid `aria-controls` and the owner experience matches accessibility requirements.

---

## UI Scope

- Add a tab config array (Inbox, Upcoming, Past, Cancelled) with labels + counts.
- Render a `TabsContent` block for each tab value.
- Include badge counts and accessible labels (e.g. “Inbox, 3”).

---

## Validation Checklist

- [ ] Each `TabsTrigger` has a matching `TabsContent` element.
- [ ] Accessible label includes count when present.
