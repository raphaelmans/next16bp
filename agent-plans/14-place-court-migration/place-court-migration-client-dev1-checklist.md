# Place/Court Migration - Client Dev Checklist

**Focus Area:** Player + Owner UI flow cohesion (design system compliant)  
**Modules:** 3A, 3B, 3C, 4A, 4B, 4C

---

## Design/UX Requirements

- [ ] Use `business-contexts/kudoscourts-design-system.md` tokens and patterns
- [ ] Multi-step flows show progress ("Step X of Y")
- [ ] Forms have labels and submit feedback
- [ ] Teal CTA used sparingly; orange for availability

---

## Owner UI

- [ ] Places list + create/edit
- [ ] Courts list per place + create/edit court
- [ ] Hours editor (multi-window/day + overnight)
- [ ] Pricing rules editor (prevent overlaps)
- [ ] Slots calendar per court with bulk-create
- [ ] Place/court filter consistent across pages

---

## Player UI

- [ ] Discovery sport filter + sport badges on place cards
- [ ] Place detail: sport selection + court list + any-available option
- [ ] Duration selector (60/120/180) updates available starts
- [ ] Booking confirmation shows assigned court and total price

---

## Validation

- [ ] No layout shifts on hover
- [ ] Focus states visible
- [ ] Responsive (mobile-first)
