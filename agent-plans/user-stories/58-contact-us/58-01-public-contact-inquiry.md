# US-58-01: Public User Submits Contact Inquiry

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **public visitor**, I want to **submit a contact inquiry** so that **KudosCourts can respond to my question or partnership request**.

---

## Acceptance Criteria

### Contact CTA

- Given I am on a public page
- When I click the footer “Contact us” CTA
- Then I am routed to `/contact-us`

### Contact Form Submission

- Given I am on `/contact-us`
- When I complete the required fields (name, email, subject, message)
- And I submit the form
- Then the platform stores my message in the database
- And the platform sends an email to the support inbox
- And I see a success confirmation

### Form Validation & Feedback

- Given I submit the form with missing or invalid values
- Then field-level validation errors are shown
- And the submission does not proceed

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Email service fails | Message is still saved and the UI shows an error state |
| Rapid repeat submissions | Request is rate-limited and shows a friendly error |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Name | text | Yes |
| Email | email | Yes |
| Subject | text | Yes |
| Message | textarea | Yes |

---

## References

- Design System: `business-contexts/kudoscourts-design-system.md`
