# US-11-03: Cohesive Color + Typography

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **user**, I want **visual consistency in color and typography** so that **the product feels calm, professional, and easy to scan**.

---

## Acceptance Criteria

### Typography Consistency

- Given I view any page
- When I scan headings and body text
- Then headings and buttons use Outfit
- And body content and inputs use Source Sans 3

### Restrained Brand Color Usage

- Given I view any page
- When primary actions are present
- Then only 1–2 primary (teal) CTAs appear per screen
- And orange is reserved for links, availability, and highlights
- And red is reserved for destructive or error states

### Neutral-First Surfaces

- Given I view cards, panels, and navigation shells
- When I inspect surfaces and borders
- Then warm neutral backgrounds dominate
- And focus rings use teal for consistency

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Teal + orange actions adjacent | Avoid side-by-side brand buttons |
| Low-contrast text | Adjust to meet WCAG AA |
| Disabled states | Use muted neutrals, not brand colors |

---

## References

- Design System: Brand Colors (Section 2)
- Design System: Typography (Section 3)
