# US-15-01: Owner Manages Organization Payment Methods

**Status:** Active  
**Supersedes:** US-08-01-02  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **add, edit, and remove payment methods for my organization** so that **players can pay me using the correct wallet or bank account**.

---

## Acceptance Criteria

### Add Payment Method

- Given I am the owner of an organization
- When I add a new payment method
- Then I must choose:
  - Method type: **Mobile Wallet** or **Bank**
  - Provider name (from a PH-only dropdown list)
  - Account name
  - Account number
  - Optional instructions specific to this method
- And the new payment method is saved under my organization

### Edit Payment Method

- Given I am the owner of an organization
- When I edit an existing payment method
- Then I can update the provider, account name, account number, and instructions
- And the updated values are saved

### Remove Payment Method

- Given I am the owner of an organization
- When I delete a payment method
- Then it is no longer shown to players

### Multiple Payment Methods

- Given I am the owner of an organization
- When I add multiple payment methods
- Then all active methods are saved and listed under my organization

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Owner tries to add duplicate method (same provider + account number) | System rejects or warns; does not create duplicate |
| Owner deletes the current default method | System prompts to set a new default or auto-selects another method |
| Owner has no payment methods configured | Players see a fallback message to contact owner |
| Invalid account number format | Save is blocked with a clear validation message |

---

## Form Fields

| Field | Type | Required |
|------|------|----------|
| Method Type | select (Mobile Wallet / Bank) | Yes |
| Provider | select (PH constants) | Yes |
| Account Name | text | Yes |
| Account Number | text | Yes |
| Instructions | textarea | No |
| Active | toggle | Yes |

---

## References

- Related: `agent-plans/user-stories/08-p2p-reservation-confirmation/08-01-02-payment-page-display-payment-instructions.md`
