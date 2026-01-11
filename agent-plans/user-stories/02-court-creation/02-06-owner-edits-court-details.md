# US-02-06: Owner Edits Court Details & Pricing

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **edit my court details and pricing settings** so that **players always see accurate information and rates when booking**.

---

## Acceptance Criteria

### Access Edit Flow

- Given I am on `/owner/courts`
- When I open the actions menu and click "Edit Details"
- Then I navigate to `/owner/courts/[id]/edit`

### Pre-filled Data

- Given I am on the edit page
- When the form loads
- Then I see the current court name, address, city, location, amenities, and payment details pre-filled

### Update Court Information

- Given I change basic information (name, address, city, coordinates)
- When I save changes
- Then the court details update and display on the public court page

### Update Pricing & Payment Details

- Given I update payment settings (free vs paid, default hourly rate, currency, payment instructions, GCash, bank transfer)
- When I save changes
- Then the court pricing configuration updates successfully

### Default Rate Propagation

- Given I update the default hourly rate
- When future time slots without a custom price exist
- Then those slots reflect the new default rate in booking flows
- And custom-priced slots keep their overridden price

### Save & Exit

- Given I save changes
- When the update succeeds
- Then I see a success confirmation and stay on the edit page or return to `/owner/courts`

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Court not found | Show 404 or redirect to courts list |
| Not court owner | Show forbidden error and redirect |
| Switch to free court | Default rate is cleared and pricing displays as Free |
| Disable payment methods | Corresponding details are cleared |
| Network error | Show error toast and keep form values |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Name | text | Yes |
| Address | text | Yes |
| City | select | Yes |
| Latitude | number | No |
| Longitude | number | No |
| Amenities | multi-select | No |
| Free vs Paid | radio | Yes |
| Default Hourly Rate | number | No (Yes if paid) |
| Currency | select | Yes |
| Payment Instructions | textarea | No |
| GCash Number | text | No |
| Bank Name | text | No |
| Bank Account Number | text | No |
| Bank Account Name | text | No |

---

## References

- PRD: Section 5 (Court management)
- PRD: Section 9 (Availability management)
- Related: `agent-plans/user-stories/02-court-creation/02-02-owner-creates-court.md`
- Related: `agent-plans/user-stories/05-availability-management/05-01-owner-creates-time-slots.md`
- Related: `agent-plans/user-stories/06-court-reservation/06-02-player-books-paid-court.md`
