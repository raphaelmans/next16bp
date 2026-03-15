# US-11-02: Full-Width Responsive Layouts

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **user on any device**, I want **full-width layouts with consistent padding** so that **content remains readable and visually stable**.

---

## Acceptance Criteria

### Full-Width Layouts

- Given I am on any route
- When I view the page layout
- Then the main content spans the available width
- And consistent horizontal padding is applied across breakpoints

### Responsive Grid Behavior

- Given I am on a discovery page using the bento grid
- When I resize the screen
- Then the grid adapts to 12 columns (desktop), 6 columns (tablet), and 1 column (mobile)

### No Horizontal Scroll

- Given I am on mobile (320px width)
- When I scroll the page
- Then no horizontal scrolling is required

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Long tables or cards | Content wraps or provides an internal scroll |
| Sticky headers | Header does not overlap page content |
| Drawer open | No layout shift on open/close |

---

## References

- PRD: Mobile-first experience requirement
- Design System: Spacing & Layout (Section 4)
