# Phase 2: Payment Page Enhancements

**Dependencies:** Phase 1 (Module 1A for payment details)  
**Parallelizable:** Yes (2A, 2C, 2D can start immediately; 2B requires 1A)  
**User Stories:** US-08-01-01, US-08-01-02, US-08-01-03, US-08-01-04

---

## Objective

Enhance the payment page at `/reservations/[id]/payment` with:
1. Countdown timer showing TTL
2. Owner's payment instructions (GCash, bank)
3. Explicit T&C checkbox
4. Payment proof form

---

## Module 2A: Countdown Timer

**User Story:** `US-08-01-01`  
**Priority:** High  
**Dependencies:** None (uses existing `expiresAt` from reservation)

### Files to Create

| File | Description |
|------|-------------|
| `src/features/reservation/components/countdown-timer.tsx` | Timer component |

### Component Implementation

```typescript
// src/features/reservation/components/countdown-timer.tsx
"use client";

import { useState, useEffect } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateRemaining = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining(0);
        setIsExpired(true);
        onExpire?.();
        return false;
      }
      setRemaining(diff);
      return true;
    };

    // Initial calculation
    if (!calculateRemaining()) return;

    // Update every second
    const interval = setInterval(() => {
      if (!calculateRemaining()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isWarning = remaining > 0 && remaining < 5 * 60 * 1000;

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
        <AlertCircle className="h-5 w-5" />
        <div>
          <span className="font-medium">Reservation Expired</span>
          <p className="text-sm">The payment window has passed.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-4 rounded-lg",
        isWarning ? "bg-amber-50 text-amber-800" : "bg-muted"
      )}
    >
      <Clock className="h-5 w-5" />
      <div>
        <span className="font-mono font-semibold text-lg">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
        <span className="ml-2">remaining</span>
        {isWarning && (
          <p className="text-sm font-medium">Time running out!</p>
        )}
      </div>
    </div>
  );
}
```

### Integration in Payment Page

```typescript
// In src/app/(auth)/reservations/[id]/payment/page.tsx
import { CountdownTimer } from "@/features/reservation/components/countdown-timer";

// Add state
const [isExpired, setIsExpired] = useState(false);

// Check initial expiration on load
useEffect(() => {
  if (reservation?.expiresAt && new Date(reservation.expiresAt) < new Date()) {
    setIsExpired(true);
  }
}, [reservation?.expiresAt]);

// In JSX, after header:
{reservation?.expiresAt && reservation.status === "AWAITING_PAYMENT" && (
  <CountdownTimer
    expiresAt={reservation.expiresAt}
    onExpire={() => setIsExpired(true)}
  />
)}

// Update button disabled state
<Button
  onClick={handleMarkPaid}
  disabled={isExpired || !termsAccepted || markPayment.isPending}
>
```

### Testing Checklist

- [ ] Timer displays correct remaining time
- [ ] Timer updates every second
- [ ] Warning state at < 5 minutes
- [ ] Expired state at 0
- [ ] Button disabled when expired
- [ ] No timer for PAYMENT_MARKED_BY_USER status

---

## Module 2B: Payment Instructions

**User Story:** `US-08-01-02`  
**Priority:** High  
**Dependencies:** Module 1A (payment details endpoint)

### Files to Create

| File | Description |
|------|-------------|
| `src/features/reservation/components/payment-instructions.tsx` | Instructions display |
| `src/features/reservation/components/copy-button.tsx` | Copy to clipboard |

### Component Implementation

```typescript
// src/features/reservation/components/payment-instructions.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Building2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface PaymentInstructionsProps {
  gcashNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  paymentInstructions?: string | null;
}

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

function PaymentMethod({
  icon,
  title,
  accountNumber,
  accountName,
}: {
  icon: React.ReactNode;
  title: string;
  accountNumber?: string | null;
  accountName?: string | null;
}) {
  if (!accountNumber) return null;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="font-medium">{title}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono">{accountNumber}</span>
        <CopyButton value={accountNumber} />
      </div>
      {accountName && (
        <p className="text-sm text-muted-foreground">{accountName}</p>
      )}
    </div>
  );
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
  const hasCustom = !!paymentInstructions;

  if (!hasGcash && !hasBank && !hasCustom) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <h3 className="font-heading font-semibold mb-3">How to Pay</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>1. Contact the court owner for payment details</li>
            <li>2. Pay via GCash, bank transfer, or cash</li>
            <li>3. Click "I Have Paid" below</li>
            <li>4. Wait for the owner to confirm</li>
          </ol>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-6">
        <h3 className="font-heading font-semibold mb-4">How to Pay</h3>
        <div className="space-y-4">
          {hasGcash && (
            <PaymentMethod
              icon={<Smartphone className="h-5 w-5 text-primary" />}
              title="GCash"
              accountNumber={gcashNumber}
              accountName={bankAccountName}
            />
          )}
          {hasBank && (
            <PaymentMethod
              icon={<Building2 className="h-5 w-5 text-primary" />}
              title={bankName || "Bank Transfer"}
              accountNumber={bankAccountNumber}
              accountName={bankAccountName}
            />
          )}
          {hasCustom && (
            <p className="text-sm text-muted-foreground">{paymentInstructions}</p>
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

### Integration in Payment Page

```typescript
// Fetch slot with payment details
const { data: slot } = useQuery({
  ...trpc.timeSlot.getById.queryOptions({ slotId: reservation?.timeSlotId || "" }),
  enabled: !!reservation?.timeSlotId,
});

// In JSX:
<PaymentInstructions
  gcashNumber={slot?.paymentDetails?.gcashNumber}
  bankName={slot?.paymentDetails?.bankName}
  bankAccountNumber={slot?.paymentDetails?.bankAccountNumber}
  bankAccountName={slot?.paymentDetails?.bankAccountName}
  paymentInstructions={slot?.paymentDetails?.paymentInstructions}
/>
```

### Testing Checklist

- [ ] GCash details display when configured
- [ ] Bank details display when configured
- [ ] Copy button works
- [ ] Fallback text when no details
- [ ] Handles partial data

---

## Module 2C: T&C Checkbox

**User Story:** `US-08-01-03`  
**Priority:** High  
**Dependencies:** None

### Files to Create

| File | Description |
|------|-------------|
| `src/features/reservation/components/terms-checkbox.tsx` | Legal checkbox |

### Component Implementation

```typescript
// src/features/reservation/components/terms-checkbox.tsx
"use client";

import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

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
          <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
            I have read and accept the{" "}
            <Link href="/terms" target="_blank" className="text-primary underline">
              Terms & Conditions
            </Link>{" "}
            and acknowledge that:
          </label>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            <li>• KudosCourts does not process or verify payments</li>
            <li>• Payment disputes are between me and the court owner</li>
            <li>• KudosCourts is not liable for booking disputes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
```

### Integration in Payment Page

```typescript
const [termsAccepted, setTermsAccepted] = useState(false);

// In JSX, before button:
<TermsCheckbox
  checked={termsAccepted}
  onCheckedChange={setTermsAccepted}
/>

// Update button:
<Button
  disabled={!termsAccepted || isExpired || markPayment.isPending}
>
```

### Testing Checklist

- [ ] Checkbox unchecked by default
- [ ] Button disabled when unchecked
- [ ] Button enabled when checked
- [ ] T&C link works

---

## Module 2D: Payment Proof Form

**User Story:** `US-08-01-04`  
**Priority:** Medium  
**Dependencies:** None (file upload deferred to US-10-02)

### Files to Create

| File | Description |
|------|-------------|
| `src/features/reservation/components/payment-proof-form.tsx` | Proof form |

### Component Implementation

```typescript
// src/features/reservation/components/payment-proof-form.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

interface PaymentProofFormProps {
  referenceNumber: string;
  notes: string;
  onReferenceChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}

export function PaymentProofForm({
  referenceNumber,
  notes,
  onReferenceChange,
  onNotesChange,
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

          {/* File upload - add when US-10-02 is complete */}
          {/* <div>
            <Label>Screenshot (Optional)</Label>
            <FileUpload bucket="payment-proofs" onUploadComplete={...} />
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Integration in Payment Page

```typescript
const [referenceNumber, setReferenceNumber] = useState("");
const [notes, setNotes] = useState("");

const addPaymentProof = api.paymentProof.add.useMutation();

const handleMarkPaid = async () => {
  try {
    // Add proof if fields filled
    if (referenceNumber || notes) {
      await addPaymentProof.mutateAsync({
        reservationId,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      });
    }

    // Mark payment
    await markPayment.mutateAsync({ reservationId, termsAccepted: true });
    router.push(`/reservations/${reservationId}`);
  } catch (error) {
    toast.error("Failed to mark payment");
  }
};

// In JSX:
<PaymentProofForm
  referenceNumber={referenceNumber}
  notes={notes}
  onReferenceChange={setReferenceNumber}
  onNotesChange={setNotes}
/>
```

### Testing Checklist

- [ ] Form fields are optional
- [ ] Can submit without proof
- [ ] Reference number saved
- [ ] Notes saved
- [ ] Proof in payment_proof table

---

## Updated Payment Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Complete Your Payment                                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ⏱️  12:34 remaining                          (2A Timer) │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Reservation Details (existing)                           │  │
│  │  Court: Court A | Date: Jan 10 | Time: 2-3pm | ₱200       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  How to Pay                                  (2B Instr.)  │  │
│  │  GCash: 0917-xxx-xxxx  [Copy]                             │  │
│  │  Bank: BDO 1234-xxx    [Copy]                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Payment Proof (Optional)                    (2D Form)    │  │
│  │  Reference: [_____________]                               │  │
│  │  Notes: [_______________]                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ☐ I accept Terms & Conditions...           (2C T&C)     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [I Have Paid]                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase Completion Checklist

- [ ] Module 2A: Countdown timer works
- [ ] Module 2B: Payment instructions display
- [ ] Module 2C: T&C checkbox required
- [ ] Module 2D: Proof form submits
- [ ] All components integrated in payment page
- [ ] Build passes
- [ ] No TypeScript errors
