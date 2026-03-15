# US-08-01-04: Payment Page - Payment Proof Form

**Status:** Active  
**Domain:** 08-p2p-reservation-confirmation  
**Parent:** US-08-01 (Player Completes P2P Payment Flow)  
**PRD Reference:** Section 7 Journey 3 Step 8

---

## Story

As a **player**, I want to **optionally submit payment proof (reference number, notes, screenshot)** so that **the court owner can verify my payment more easily**.

---

## Context

Payment proof is optional but helps owners verify payments. The backend `paymentProof` module already exists with full CRUD operations. This story adds the form UI on the payment page.

**Backend Already Implemented:**
- `paymentProof.add` endpoint
- `paymentProof.update` endpoint  
- `paymentProof.get` endpoint
- `payment_proof` table with `reference_number`, `notes`, `file_url`

**File Upload:**
- Screenshot upload handled by US-10-02 (Player Uploads Payment Proof)
- This story references but does not implement file upload

---

## Acceptance Criteria

### Proof Form is Optional

- Given I am on the payment page
- When I don't fill any proof fields
- Then I can still click "I Have Paid" (proof is optional)

### Reference Number Input

- Given I am on the payment page
- Then I see an optional "Reference Number" field
- And I can enter a payment reference (e.g., "GC-12345678")

### Notes Input

- Given I am on the payment page
- Then I see an optional "Notes" field
- And I can enter additional context (e.g., "Paid via GCash at 2:30pm")

### File Upload (Future - US-10-02)

- Given file upload is implemented (US-10-02)
- Then I see an optional "Upload Screenshot" field
- And I can upload a payment confirmation image

### Proof Saved on Submit

- Given I have entered proof details
- When I click "I Have Paid"
- Then the proof is saved via `paymentProof.add`
- And the reservation status changes to `PAYMENT_MARKED_BY_USER`

### Proof Without Marking Payment

- Given I fill proof fields but don't submit
- When I navigate away
- Then the proof is not saved (only saved on submit)

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Submit without proof | Works, no proof record created |
| Submit with only reference | Proof record created with reference only |
| Submit with only notes | Proof record created with notes only |
| File upload fails | Show error, allow retry or continue without |
| Very long reference number | Max 100 characters |
| Very long notes | Max 500 characters |
| Submit fails after proof added | Proof may be orphaned, handle gracefully |

---

## UI Layout

### Proof Form Section

```
┌─────────────────────────────────────────────────────────────────┐
│  Payment Proof (Optional)                                       │
│  Help the owner verify your payment faster                      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Reference Number                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ e.g., GC-12345678                                   │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Notes                                                     │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ e.g., Paid via GCash at 2:30pm                      │  │  │
│  │  │                                                     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Screenshot (Optional)                                     │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  📷  Click to upload or drag and drop               │  │  │
│  │  │      PNG, JPG up to 5MB                             │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Collapsed/Expandable (Alternative)

```
┌─────────────────────────────────────────────────────────────────┐
│  ▼ Add Payment Proof (Optional)                                 │
│    Help the owner verify your payment faster                    │
│                                                                 │
│    [Reference Number field]                                     │
│    [Notes field]                                                │
│    [Screenshot upload] ← Handled by US-10-02                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

### Existing Backend Endpoints

```typescript
// src/modules/payment-proof/payment-proof.router.ts
paymentProof.add: {
  input: {
    reservationId: string,
    referenceNumber?: string,
    notes?: string,
    fileUrl?: string  // from file upload
  },
  output: PaymentProofRecord
}
```

### Form State

```typescript
const [referenceNumber, setReferenceNumber] = useState("");
const [notes, setNotes] = useState("");
const [fileUrl, setFileUrl] = useState<string | null>(null);

const addPaymentProof = api.paymentProof.add.useMutation();
```

### Submit Handler

```typescript
const handleMarkPaid = async () => {
  try {
    // First add proof if any fields filled
    const hasProof = referenceNumber || notes || fileUrl;
    if (hasProof) {
      await addPaymentProof.mutateAsync({
        reservationId,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
        fileUrl: fileUrl || undefined,
      });
    }
    
    // Then mark payment
    await markPayment.mutateAsync({ 
      reservationId, 
      termsAccepted: true 
    });
    
    router.push(`/reservations/${reservationId}`);
  } catch (error) {
    toast.error("Failed to mark payment");
  }
};
```

### Form Component

```typescript
// src/features/reservation/components/payment-proof-form.tsx
interface PaymentProofFormProps {
  referenceNumber: string;
  notes: string;
  onReferenceChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onFileUrlChange?: (url: string | null) => void;
  showFileUpload?: boolean;
}

export function PaymentProofForm({
  referenceNumber,
  notes,
  onReferenceChange,
  onNotesChange,
  onFileUrlChange,
  showFileUpload = false,
}: PaymentProofFormProps) {
  return (
    <Card className="bg-muted/30">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-heading font-semibold">
              Payment Proof (Optional)
            </h3>
            <p className="text-sm text-muted-foreground">
              Help the owner verify your payment faster
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="reference">Reference Number</Label>
            <Input
              id="reference"
              placeholder="e.g., GC-12345678"
              value={referenceNumber}
              onChange={(e) => onReferenceChange(e.target.value)}
              maxLength={100}
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="e.g., Paid via GCash at 2:30pm"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
          
          {showFileUpload && onFileUrlChange && (
            <div>
              <Label>Screenshot (Optional)</Label>
              <FileUpload 
                bucket="payment-proofs"
                onUploadComplete={(url) => onFileUrlChange(url)}
                accept="image/*"
                maxSize={5 * 1024 * 1024} // 5MB
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Integration in Payment Page

```typescript
// State
const [referenceNumber, setReferenceNumber] = useState("");
const [notes, setNotes] = useState("");
const [fileUrl, setFileUrl] = useState<string | null>(null);

// In JSX
<PaymentProofForm
  referenceNumber={referenceNumber}
  notes={notes}
  onReferenceChange={setReferenceNumber}
  onNotesChange={setNotes}
  onFileUrlChange={setFileUrl}
  showFileUpload={false} // Enable when US-10-02 is complete
/>
```

---

## Form Fields

| Field | Type | Required | Max Length | Placeholder |
|-------|------|----------|------------|-------------|
| Reference Number | text | No | 100 | "e.g., GC-12345678" |
| Notes | textarea | No | 500 | "e.g., Paid via GCash at 2:30pm" |
| Screenshot | file | No | 5MB | "Click to upload" |

---

## Testing Checklist

- [ ] Form fields are optional
- [ ] Can submit without filling any proof fields
- [ ] Reference number saved correctly
- [ ] Notes saved correctly
- [ ] Max length enforced (100/500 chars)
- [ ] Proof record created in `payment_proof` table
- [ ] Reservation status changes to `PAYMENT_MARKED_BY_USER`
- [ ] Error handling for failed proof submission
- [ ] Loading state during submission
- [ ] File upload works when implemented (US-10-02)

---

## Dependencies

- `paymentProof.add` endpoint (exists)
- File upload: `10-asset-uploads/10-02-player-uploads-payment-proof.md` (parallel work)
- `FileUpload` component from shared components
