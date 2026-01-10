# US-08-01-02: Payment Page - Display Payment Instructions

**Status:** Active  
**Domain:** 08-p2p-reservation-confirmation  
**Parent:** US-08-01 (Player Completes P2P Payment Flow)  
**PRD Reference:** Section 7 Journey 3 Step 5

---

## Story

As a **player**, I want to **see the court owner's payment details (GCash, bank account)** so that **I know where to send my payment**.

---

## Context

Payment details are stored in `reservable_court_detail` table. Currently the payment page shows generic text: "Contact the court owner for payment details". This story adds fetching and displaying the owner's actual payment methods.

**Current State:**
- Generic instructions shown
- No GCash/bank details displayed

**Target State:**
- Fetch payment details from court
- Display GCash number with copy button
- Display bank details with copy button
- Show custom instructions if configured

---

## Acceptance Criteria

### Display GCash Details

- Given the court owner has configured GCash payment
- When I view the payment page
- Then I see the GCash number displayed
- And I can tap/click to copy the number

### Display Bank Details

- Given the court owner has configured bank payment
- When I view the payment page
- Then I see bank name, account number, and account name
- And I can tap/click to copy the account number

### Display Custom Instructions

- Given the court owner has added custom payment instructions
- When I view the payment page
- Then I see the custom instructions text

### Fallback for No Payment Details

- Given the court owner hasn't configured payment details
- When I view the payment page
- Then I see generic text: "Contact the court owner for payment details"

### Multiple Payment Methods

- Given the court owner has both GCash and bank configured
- When I view the payment page
- Then I see both payment methods displayed
- And each has its own copy button

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No payment details configured | Show generic fallback text |
| Only GCash configured | Show only GCash section |
| Only bank configured | Show only bank section |
| Both configured | Show both sections |
| Very long custom instructions | Wrap text, no truncation |
| Copy fails (browser restriction) | Show toast error |

---

## UI Layout

### Payment Instructions Card

```
┌─────────────────────────────────────────────────────────────────┐
│  How to Pay                                                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📱 GCash                                                  │  │
│  │                                                           │  │
│  │  0917-123-4567                                [Copy]      │  │
│  │  Account: Juan Dela Cruz                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🏦 Bank Transfer                                          │  │
│  │                                                           │  │
│  │  BDO                                                      │  │
│  │  1234-5678-9012                               [Copy]      │  │
│  │  Account: Juan Dela Cruz Sports                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Or pay cash at the court before your reserved time.            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Fallback (No Details)

```
┌─────────────────────────────────────────────────────────────────┐
│  How to Pay                                                     │
│                                                                 │
│  1. Contact the court owner for payment details                 │
│  2. Pay via GCash, bank transfer, or cash                       │
│  3. Click "I Have Paid" below                                   │
│  4. Wait for the owner to confirm your payment                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

### Backend Enhancement Required

Need to expose court payment details. Two options:

**Option A: Extend `timeSlot.getById`** (Recommended)

Add court payment details to time slot response:

```typescript
// Enhanced response:
{
  id: string,
  courtId: string,
  startTime: string,
  endTime: string,
  priceCents: number,
  // NEW: Payment details from reservable_court_detail
  paymentDetails?: {
    gcashNumber: string | null,
    bankName: string | null,
    bankAccountNumber: string | null,
    bankAccountName: string | null,
    paymentInstructions: string | null,
  }
}
```

**Option B: New endpoint `court.getPaymentDetails`**

```typescript
// Input:
{ courtId: string }

// Response:
{
  gcashNumber: string | null,
  bankName: string | null,
  bankAccountNumber: string | null,
  bankAccountName: string | null,
  paymentInstructions: string | null,
}
```

### Data Source

`reservable_court_detail` table already has all fields:

```sql
SELECT 
  gcash_number,
  bank_name,
  bank_account_number,
  bank_account_name,
  payment_instructions
FROM reservable_court_detail
WHERE court_id = ?
```

### Frontend Component

```typescript
// src/features/reservation/components/payment-instructions.tsx
interface PaymentInstructionsProps {
  gcashNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  paymentInstructions?: string | null;
}

export function PaymentInstructions({
  gcashNumber,
  bankName,
  bankAccountNumber,
  bankAccountName,
  paymentInstructions,
}: PaymentInstructionsProps) {
  const hasGcash = !!gcashNumber;
  const hasBank = !!bankAccountNumber;
  
  if (!hasGcash && !hasBank && !paymentInstructions) {
    return <FallbackInstructions />;
  }
  
  return (
    <Card className="bg-muted/30">
      <CardContent className="p-6">
        <h3 className="font-heading font-semibold mb-4">How to Pay</h3>
        
        <div className="space-y-4">
          {hasGcash && (
            <PaymentMethod
              icon={<Smartphone className="h-5 w-5" />}
              title="GCash"
              accountNumber={gcashNumber}
              accountName={bankAccountName}
            />
          )}
          
          {hasBank && (
            <PaymentMethod
              icon={<Building className="h-5 w-5" />}
              title={bankName || "Bank Transfer"}
              accountNumber={bankAccountNumber}
              accountName={bankAccountName}
            />
          )}
          
          {paymentInstructions && (
            <p className="text-sm text-muted-foreground">
              {paymentInstructions}
            </p>
          )}
          
          <p className="text-sm text-muted-foreground">
            Or pay cash at the court before your reserved time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Copy Button Component

```typescript
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };
  
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}
```

---

## API Integration

### Option A: Enhanced Time Slot Query

```typescript
// In payment page, after fetching slot:
const { data: slot } = useQuery({
  ...trpc.timeSlot.getById.queryOptions({ slotId: reservation?.timeSlotId }),
  enabled: !!reservation?.timeSlotId,
});

// Use slot.paymentDetails in PaymentInstructions component
<PaymentInstructions
  gcashNumber={slot?.paymentDetails?.gcashNumber}
  bankName={slot?.paymentDetails?.bankName}
  bankAccountNumber={slot?.paymentDetails?.bankAccountNumber}
  bankAccountName={slot?.paymentDetails?.bankAccountName}
  paymentInstructions={slot?.paymentDetails?.paymentInstructions}
/>
```

### Backend Enhancement

```typescript
// In timeSlot.service.ts or repository
async getById(slotId: string) {
  const slot = await db
    .select({
      // existing fields...
      paymentDetails: {
        gcashNumber: reservableCourtDetail.gcashNumber,
        bankName: reservableCourtDetail.bankName,
        bankAccountNumber: reservableCourtDetail.bankAccountNumber,
        bankAccountName: reservableCourtDetail.bankAccountName,
        paymentInstructions: reservableCourtDetail.paymentInstructions,
      },
    })
    .from(timeSlot)
    .innerJoin(court, eq(court.id, timeSlot.courtId))
    .leftJoin(reservableCourtDetail, eq(reservableCourtDetail.courtId, court.id))
    .where(eq(timeSlot.id, slotId))
    .limit(1);
    
  return slot[0];
}
```

---

## Testing Checklist

- [ ] GCash details display when configured
- [ ] Bank details display when configured
- [ ] Custom instructions display when configured
- [ ] Copy button works for GCash number
- [ ] Copy button works for bank account number
- [ ] Copy success feedback (checkmark or toast)
- [ ] Fallback text shows when no payment details
- [ ] Handles partial data (only GCash, only bank)
- [ ] Both methods show when both configured
- [ ] Long instructions wrap correctly

---

## Dependencies

- `reservable_court_detail` table (exists)
- Backend endpoint enhancement (needs creation)
- `timeSlot.getById` or new `court.getPaymentDetails` endpoint
