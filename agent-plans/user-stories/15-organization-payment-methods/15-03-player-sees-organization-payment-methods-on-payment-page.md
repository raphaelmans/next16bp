# US-15-03: Player Sees Organization Payment Methods On Payment Page

**Status:** Active  
**Supersedes:** US-08-01-02  
**Superseded By:** -

---

## Story

As a **player**, I want to **see the organization’s payment methods (wallet/bank) with clear instructions** so that **I know exactly how to pay and what reference details to include**.

---

## Acceptance Criteria

### Display Active Payment Methods

- Given I have a reservation that requires payment
- When I open the payment page
- Then I see the organization’s active payment methods
- And each method displays:
  - Provider name (e.g., GCash, BPI)
  - Account name
  - Account number
  - Per-method instructions (if provided)

### Copy Account Number

- Given I am on the payment page
- When I click “Copy” for a payment method
- Then the account number is copied to clipboard

### Default Method Highlight

- Given the organization has a default payment method
- When I open the payment page
- Then the default payment method is shown first and/or marked as recommended

### Fallback When No Methods

- Given the organization has not configured any active payment methods
- When I open the payment page
- Then I see a fallback message telling me to contact the owner for payment details

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Only wallet methods exist | Only wallet methods are shown |
| Only bank methods exist | Only bank methods are shown |
| Very long instructions | Text wraps and remains readable |
| Clipboard permission denied | Show an error message and provide the account number for manual copy |

---

## References

- Supersedes: `agent-plans/user-stories/08-p2p-reservation-confirmation/08-01-02-payment-page-display-payment-instructions.md`
