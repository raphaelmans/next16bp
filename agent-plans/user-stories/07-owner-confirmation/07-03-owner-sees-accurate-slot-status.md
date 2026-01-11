# US-07-03: Owner Sees Accurate Slot Reservation Status

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want **slot list rows to show the correct reservation status and quick actions** so that **I can respond quickly without misleading payment indicators**.

---

## Acceptance Criteria

### Awaiting Payment Status

- Given a slot is `HELD` and the reservation status is `AWAITING_PAYMENT`
- When I view the slot list
- Then the status label reads "Awaiting payment"
- And the payment marker is not shown
- And quick actions show: **View Reservation** and **Cancel/Expire**

### Payment Marked Status

- Given a slot is `HELD` and the reservation status is `PAYMENT_MARKED_BY_USER`
- When I view the slot list
- Then the status label reads "Payment marked"
- And quick actions show: **Confirm** and **Reject**
- And the reject action requires a reason before submission

### Other Slot States

- Given a slot is `AVAILABLE`, `BOOKED`, or `BLOCKED`
- When I view the slot list
- Then no payment indicators or confirmation actions appear

### Action Sync

- Given I confirm, reject, or cancel from the slot list
- When the action succeeds
- Then the slot list refreshes with the updated status
- And the pending badge count updates in the sidebar

### Data Mapping

- Given the slot list is loaded
- When a slot is `HELD`
- Then the UI uses the reservation status from the backend (not just slot status)
- And if no reservation is returned, the UI shows a neutral "Held" label with no actions

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Reservation expired while viewing | Label updates to "Expired" on refresh/poll |
| Duplicate actions | Buttons disable while mutation is pending |
| Network error on action | Show error toast and keep current state |
| Missing reservation link | Hide quick actions and show "Held" badge |

---

## References

- PRD: Section 7 Journey 4 (Owner confirmation flow)
- Related: `agent-plans/user-stories/07-owner-confirmation/07-01-owner-views-pending-reservations.md`
- Related: `agent-plans/user-stories/07-owner-confirmation/07-02-owner-confirms-rejects-reservation.md`
