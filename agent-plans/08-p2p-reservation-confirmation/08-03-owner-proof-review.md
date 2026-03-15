# Phase 3: Owner Proof Review

**Dependencies:** Phase 1 (Module 1B for proof in response)  
**Parallelizable:** Yes (3A, 3B can run in parallel)  
**User Stories:** US-08-02-02

---

## Objective

Enable court owners to view payment proof submitted by players when reviewing pending reservations.

---

## Module 3A: Proof Card Component

**User Story:** `US-08-02-02`  
**Priority:** High

### Files to Create

| File | Description |
|------|-------------|
| `src/features/owner/components/payment-proof-card.tsx` | Proof display card |

### Component Implementation

```typescript
// src/features/owner/components/payment-proof-card.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { ImagePreview } from "./image-preview";

interface PaymentProofCardProps {
  proof: {
    referenceNumber: string | null;
    notes: string | null;
    fileUrl: string | null;
    createdAt: string;
  } | null;
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

export function PaymentProofCard({ proof }: PaymentProofCardProps) {
  if (!proof) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Payment Proof</h4>
          </div>
          <p className="text-sm text-muted-foreground">No proof provided</p>
        </CardContent>
      </Card>
    );
  }

  const hasContent = proof.referenceNumber || proof.notes || proof.fileUrl;

  if (!hasContent) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Payment Proof</h4>
          </div>
          <p className="text-sm text-muted-foreground">No proof provided</p>
        </CardContent>
      </Card>
    );
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
                Reference:{" "}
                <span className="font-mono font-medium">
                  {proof.referenceNumber}
                </span>
              </span>
              <CopyButton value={proof.referenceNumber} />
            </div>
          )}

          {proof.notes && (
            <p className="text-sm text-muted-foreground">{proof.notes}</p>
          )}

          {proof.fileUrl && (
            <ImagePreview src={proof.fileUrl} alt="Payment screenshot" />
          )}

          <p className="text-xs text-muted-foreground">
            Submitted {format(new Date(proof.createdAt), "MMM d, h:mm a")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Testing Checklist

- [ ] Card shows when proof exists
- [ ] "No proof provided" when no proof
- [ ] Reference number displays and copies
- [ ] Notes display correctly
- [ ] Timestamp displays correctly

---

## Module 3B: Image Preview Component

**User Story:** `US-08-02-02`  
**Priority:** Medium  
**Note:** Only functional when file upload (US-10-02) is complete

### Files to Create

| File | Description |
|------|-------------|
| `src/features/owner/components/image-preview.tsx` | Thumbnail with zoom |

### Component Implementation

```typescript
// src/features/owner/components/image-preview.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageIcon } from "lucide-react";

interface ImagePreviewProps {
  src: string;
  alt: string;
}

export function ImagePreview({ src, alt }: ImagePreviewProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-20 h-20 rounded border bg-muted flex items-center justify-center">
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="relative w-20 h-20 rounded overflow-hidden border hover:opacity-80 transition-opacity">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            onError={() => setError(true)}
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-0">
        <div className="relative aspect-video">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            onError={() => setError(true)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Testing Checklist

- [ ] Thumbnail displays
- [ ] Click opens full-size modal
- [ ] Error state shows placeholder
- [ ] Modal closes correctly

---

## Integration in Owner Reservations

### Update Hook Type

```typescript
// src/features/owner/hooks/use-owner-reservations.ts
interface MappedReservation {
  id: string;
  status: string;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  courtName: string;
  startTime: string;
  endTime: string;
  amountCents: number;
  currency: string;
  createdAt: string;
  // NEW
  paymentProof: {
    referenceNumber: string | null;
    notes: string | null;
    fileUrl: string | null;
    createdAt: string;
  } | null;
}
```

### Update Mapping

```typescript
// In use-owner-reservations.ts, update the mapping:
return data.map((item) => ({
  // ... existing fields
  paymentProof: item.paymentProof ?? null,
}));
```

### Update Reservation Card

```typescript
// In owner reservations page or component
import { PaymentProofCard } from "@/features/owner/components/payment-proof-card";

// In the reservation card JSX:
<PaymentProofCard proof={reservation.paymentProof} />
```

---

## UI Layout

### Reservation Card with Proof

```
┌─────────────────────────────────────────────────────────────────┐
│  Pending Reservation                                            │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  👤 Juan Dela Cruz                                         │  │
│  │  📧 juan@email.com | 📱 0917-123-4567                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🏟️ Court A | 📅 Jan 10 | 🕐 2-3pm | 💰 ₱200                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📋 Payment Proof                                          │  │
│  │                                                           │  │
│  │  Reference: GC-12345678                       [Copy]      │  │
│  │  Notes: Paid via GCash at 2:30pm                          │  │
│  │  [📷]  (thumbnail)                                        │  │
│  │                                                           │  │
│  │  Submitted Jan 10, 2:35 PM                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│                              [Reject]    [Confirm Payment]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase Completion Checklist

- [ ] Module 3A: Payment proof card component
- [ ] Module 3B: Image preview component
- [ ] Hook types updated
- [ ] Mapping includes paymentProof
- [ ] Card integrated in reservation list
- [ ] Build passes
- [ ] No TypeScript errors
