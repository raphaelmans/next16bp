# US-08-02-02: Owner Dashboard - Display Payment Proof Card

**Status:** Active  
**Domain:** 08-p2p-reservation-confirmation  
**Parent:** US-08-02 (Owner Reviews Payment Proof)

---

## Story

As a **court owner**, I want to **see payment proof details on the reservation card** so that **I can verify the payment before confirming**.

---

## Context

After US-08-02-01 adds payment proof to the API response, this story adds the UI component to display it in the owner's pending reservations view.

**Current State:**
- Reservation card shows player info, court, slot, amount
- No payment proof section

**Target State:**
- Payment proof section shows reference, notes, screenshot
- "No proof provided" when player skipped proof submission

---

## Acceptance Criteria

### Proof Card Displayed

- Given a reservation has payment proof
- When I view the pending reservations list
- Then I see a "Payment Proof" section on the reservation card

### Reference Number Displayed

- Given payment proof has a reference number
- Then I see "Reference: GC-12345678" displayed
- And I can copy the reference number

### Notes Displayed

- Given payment proof has notes
- Then I see the notes text displayed

### Screenshot Displayed

- Given payment proof has a file URL
- Then I see a thumbnail of the screenshot
- And I can click to view full-size

### No Proof State

- Given a reservation has no payment proof
- Then the "Payment Proof" section shows "No proof provided"

### Proof Doesn't Block Actions

- Given a reservation has no proof
- When I view the reservation
- Then I can still Confirm or Reject (proof is optional)

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No proof submitted | Show "No proof provided" |
| Only reference number | Show reference, hide others |
| Only notes | Show notes, hide others |
| Only screenshot | Show thumbnail, hide others |
| All fields present | Show all fields |
| Very long notes | Truncate with "Show more" |
| Image load fails | Show placeholder/error state |

---

## UI Layout

### Proof Card on Reservation

```
┌─────────────────────────────────────────────────────────────────┐
│  Pending Reservation                                            │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  👤 Juan Dela Cruz                                         │  │
│  │  📧 juan@email.com                                         │  │
│  │  📱 0917-123-4567                                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🏟️ Court A                                                │  │
│  │  📅 January 10, 2025                                       │  │
│  │  🕐 2:00 PM - 3:00 PM                                       │  │
│  │  💰 ₱200                                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📋 Payment Proof                                          │  │
│  │                                                           │  │
│  │  Reference: GC-12345678                       [Copy]      │  │
│  │  Notes: Paid via GCash at 2:30pm                          │  │
│  │                                                           │  │
│  │  ┌─────────────┐                                          │  │
│  │  │ 📷 Screenshot │  Click to view full size               │  │
│  │  └─────────────┘                                          │  │
│  │                                                           │  │
│  │  Submitted Jan 10, 2:35 PM                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│                              [Reject]    [Confirm Payment]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### No Proof State

```
┌───────────────────────────────────────────────────────────────┐
│  📋 Payment Proof                                              │
│                                                               │
│  No proof provided                                            │
│  The player did not submit payment proof.                     │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

### Component Structure

```typescript
// src/features/owner/components/payment-proof-card.tsx
interface PaymentProofCardProps {
  proof: {
    referenceNumber: string | null;
    notes: string | null;
    fileUrl: string | null;
    createdAt: string;
  } | null;
}

export function PaymentProofCard({ proof }: PaymentProofCardProps) {
  if (!proof) {
    return <NoProofCard />;
  }
  
  const hasContent = proof.referenceNumber || proof.notes || proof.fileUrl;
  
  if (!hasContent) {
    return <NoProofCard />;
  }
  
  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-medium">Payment Proof</h4>
        </div>
        
        <div className="space-y-3">
          {proof.referenceNumber && (
            <div className="flex items-center justify-between">
              <span className="text-sm">
                Reference: <span className="font-mono">{proof.referenceNumber}</span>
              </span>
              <CopyButton value={proof.referenceNumber} />
            </div>
          )}
          
          {proof.notes && (
            <p className="text-sm text-muted-foreground">
              {proof.notes}
            </p>
          )}
          
          {proof.fileUrl && (
            <ImagePreview 
              src={proof.fileUrl} 
              alt="Payment screenshot" 
            />
          )}
          
          <p className="text-xs text-muted-foreground">
            Submitted {format(new Date(proof.createdAt), "MMM d, h:mm a")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function NoProofCard() {
  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-medium">Payment Proof</h4>
        </div>
        <p className="text-sm text-muted-foreground">
          No proof provided
        </p>
      </CardContent>
    </Card>
  );
}
```

### Image Preview Component

```typescript
// src/features/owner/components/image-preview.tsx
interface ImagePreviewProps {
  src: string;
  alt: string;
}

export function ImagePreview({ src, alt }: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="relative w-20 h-20 rounded overflow-hidden border hover:opacity-80"
      >
        <Image src={src} alt={alt} fill className="object-cover" />
      </button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <Image src={src} alt={alt} width={800} height={600} className="object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### Integration in Owner Reservations

```typescript
// In owner reservations page/component
{reservation.paymentProof !== undefined && (
  <PaymentProofCard proof={reservation.paymentProof} />
)}
```

### Update Frontend Hook

```typescript
// src/features/owner/hooks/use-owner-reservations.ts
// Update the mapped reservation type to include paymentProof

interface MappedReservation {
  // ... existing fields
  paymentProof: {
    referenceNumber: string | null;
    notes: string | null;
    fileUrl: string | null;
    createdAt: string;
  } | null;
}
```

---

## Testing Checklist

- [ ] Proof card displays when proof exists
- [ ] "No proof provided" shows when no proof
- [ ] Reference number displays correctly
- [ ] Copy button works for reference
- [ ] Notes display correctly
- [ ] Long notes truncate appropriately
- [ ] Screenshot thumbnail displays
- [ ] Click thumbnail opens full-size view
- [ ] Full-size image dialog works
- [ ] Submitted timestamp displays correctly
- [ ] Layout doesn't break with missing fields
- [ ] Confirm/Reject buttons still work

---

## Dependencies

- US-08-02-01 (Backend includes payment proof in response)
- Image component for screenshot display
- Dialog component for full-size view
