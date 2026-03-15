# US-17-02: Public Views Curated Place (Read-only, Contact Visible)

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player**, I want to **view a curated place with its courts and contact info** so that **I can evaluate the venue and reach out even if online booking is not available yet**.

---

## Acceptance Criteria

### View Place Details

- Given I am on a public place detail page
- When the place is curated
- Then I can see the place name, address, city, and court inventory

### Courts Are Visible

- Given a curated place has explicit courts
- When I view the place page
- Then I can see each court label and its sport

### Contact Info Is Visible

- Given a curated place has contact details
- When I view the place page
- Then I can see contact links (website, Facebook, Instagram) and contact text (e.g., Viber info)

### Booking Disabled for Curated

- Given I am on a curated place page
- When I look for booking actions
- Then I do not see availability selection and cannot start a reservation

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Curated place missing contact details | Show the section, but render only available fields |
| Curated place has inactive courts | Show courts as inactive (read-only), no booking |
| Curated place has no photos | Show placeholder images / empty gallery state |

---

## References

- PRD: Curated listings are discoverable but not bookable
