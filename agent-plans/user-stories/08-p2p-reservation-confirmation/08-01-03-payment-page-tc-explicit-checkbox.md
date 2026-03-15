# US-08-01-03: Payment Page - T&C Explicit Checkbox

**Status:** Active  
**Domain:** 08-p2p-reservation-confirmation  
**Parent:** US-08-01 (Player Completes P2P Payment Flow)  
**PRD Reference:** Section 17 (Legal & Liability)

---

## Story

As a **player**, I want to **explicitly acknowledge the Terms & Conditions and payment disclaimer** so that **I understand KudosCourts is not responsible for payment disputes**.

---

## Context

Per PRD Section 17, players must accept T&C via explicit checkbox before marking payment. Currently the payment page auto-sends `termsAccepted: true` without user interaction. This story adds the explicit checkbox UI.

**Current State:**
- Button click sends `termsAccepted: true` automatically
- No explicit checkbox shown
- Disclaimer text at bottom (not actionable)

**Target State:**
- Checkbox must be checked to enable "I Have Paid" button
- Legal text clearly explains platform neutrality
- `termsAcceptedAt` recorded in database

---

## Acceptance Criteria

### T&C Checkbox Required

- Given I am on the payment page
- When I have not checked the T&C checkbox
- Then the "I Have Paid" button is disabled

### T&C Checkbox Text

- Given I am on the payment page
- Then I see a checkbox with legal acknowledgment text
- And the text explains KudosCourts' non-liability for payment disputes

### T&C Link

- Given I see the T&C checkbox
- When I click "Terms & Conditions" link
- Then I am shown the T&C (modal or new tab)

### Checkbox Enables Button

- Given the T&C checkbox is unchecked
- When I check the checkbox
- Then the "I Have Paid" button becomes enabled

### Audit Trail

- Given I check the T&C and submit
- Then `termsAcceptedAt` timestamp is recorded in the reservation
- And this supports future dispute investigation

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Checkbox unchecked, click button | Button disabled, nothing happens |
| Check then uncheck | Button disables again |
| Page refresh with checkbox state | Checkbox resets to unchecked |
| Submit fails | Checkbox state preserved |

---

## UI Layout

### Checkbox Before Button

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ... payment instructions above ...                             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ☐  I have read and accept the Terms & Conditions         │  │
│  │     and acknowledge that:                                  │  │
│  │     • KudosCourts does not process or verify payments     │  │
│  │     • Payment disputes are between me and the court owner │  │
│  │     • KudosCourts is not liable for booking disputes      │  │
│  │                                                           │  │
│  │     Read full Terms & Conditions ↗                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [I Have Paid]  (disabled until checkbox checked)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Checkbox Checked

```
┌───────────────────────────────────────────────────────────────┐
│  ☑  I have read and accept the Terms & Conditions            │
│     and acknowledge that:                                     │
│     • KudosCourts does not process or verify payments        │
│     • Payment disputes are between me and the court owner    │
│     • KudosCourts is not liable for booking disputes         │
│                                                              │
│     Read full Terms & Conditions ↗                           │
└───────────────────────────────────────────────────────────────┘

[I Have Paid]  (enabled, primary style)
```

---

## Technical Notes

### Legal Text

```
I have read and accept the Terms & Conditions and acknowledge that:
• KudosCourts does not process or verify payments
• Payment disputes are between me and the court owner
• KudosCourts is not liable for booking disputes
```

### Checkbox State

```typescript
const [termsAccepted, setTermsAccepted] = useState(false);

// Button disabled state
<Button
  disabled={!termsAccepted || isExpired || markPayment.isPending}
  onClick={handleMarkPaid}
>
  I Have Paid
</Button>
```

### Component Implementation

```typescript
// src/features/reservation/components/terms-checkbox.tsx
interface TermsCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function TermsCheckbox({ checked, onCheckedChange }: TermsCheckboxProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 border">
      <div className="flex items-start gap-3">
        <Checkbox
          id="terms"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          className="mt-1"
        />
        <div className="flex-1">
          <label 
            htmlFor="terms" 
            className="text-sm font-medium cursor-pointer"
          >
            I have read and accept the{" "}
            <Link 
              href="/terms" 
              target="_blank" 
              className="text-primary underline"
            >
              Terms & Conditions
            </Link>
            {" "}and acknowledge that:
          </label>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            <li>• KudosCourts does not process or verify payments</li>
            <li>• Payment disputes are between me and the court owner</li>
            <li>• KudosCourts is not liable for booking disputes</li>
          </ul>
          <Link 
            href="/terms" 
            target="_blank"
            className="text-sm text-primary underline mt-2 inline-block"
          >
            Read full Terms & Conditions ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### Integration in Payment Page

```typescript
// In payment page
const [termsAccepted, setTermsAccepted] = useState(false);

// In JSX, before the button:
<TermsCheckbox
  checked={termsAccepted}
  onCheckedChange={setTermsAccepted}
/>

<Button
  onClick={handleMarkPaid}
  disabled={!termsAccepted || isExpired || markPayment.isPending}
  className="w-full"
  size="lg"
>
  {markPayment.isPending ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Processing...
    </>
  ) : (
    <>
      <CheckCircle className="h-4 w-4 mr-2" />
      I Have Paid
    </>
  )}
</Button>
```

### Backend Already Handles

The `reservation.markPayment` endpoint already validates `termsAccepted: true` and sets `termsAcceptedAt`:

```typescript
// Input schema already requires:
{
  reservationId: string,
  termsAccepted: true // literal true required
}

// Service sets:
termsAcceptedAt: new Date()
```

---

## Testing Checklist

- [ ] Checkbox unchecked by default
- [ ] Button disabled when unchecked
- [ ] Button enabled when checked
- [ ] Checkbox can be toggled
- [ ] Uncheck disables button again
- [ ] T&C link opens in new tab
- [ ] Legal text is readable and complete
- [ ] `termsAcceptedAt` recorded on submission
- [ ] Works with other disabled states (expired, loading)

---

## Dependencies

- None (UI-only enhancement)
- T&C page at `/terms` (may need creation if not exists)
