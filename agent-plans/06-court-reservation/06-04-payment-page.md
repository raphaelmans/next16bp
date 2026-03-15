# Phase 4: Simplified Payment Page

**Module ID:** 4A  
**Estimated Time:** 2 hours  
**Dependencies:** Phase 3 (Booking UI)

---

## Objective

Implement a simplified payment page where players can mark their external payment as complete. This is a minimal version without TTL timer, payment instructions, or proof upload.

---

## File

**File:** `src/app/(auth)/reservations/[id]/payment/page.tsx`

---

## Page Implementation

```tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useMarkPayment } from "@/features/reservation/hooks";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, Loader2, Clock } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;
  const trpc = useTRPC();

  // Fetch reservation details
  const { data: reservation, isLoading } = useQuery({
    ...trpc.reservation.getById.queryOptions({ reservationId }),
  });

  // Fetch slot details for display
  const { data: slot } = useQuery({
    ...trpc.timeSlot.getById.queryOptions({ slotId: reservation?.timeSlotId || "" }),
    enabled: !!reservation?.timeSlotId,
  });

  const markPayment = useMarkPayment();

  const handleMarkPaid = () => {
    markPayment.mutate(
      { reservationId, termsAccepted: true },
      {
        onSuccess: () => {
          router.push(`/reservations/${reservationId}`);
        },
      }
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Already completed
  if (reservation?.status !== "AWAITING_PAYMENT") {
    return (
      <div className="max-w-lg mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-[#059669] mb-4" />
            <h2 className="font-heading font-semibold text-lg mb-2">
              Payment Already Marked
            </h2>
            <p className="text-muted-foreground mb-4">
              {reservation?.status === "PAYMENT_MARKED_BY_USER"
                ? "Your payment is awaiting owner confirmation."
                : reservation?.status === "CONFIRMED"
                  ? "Your reservation is confirmed!"
                  : "This reservation has been processed."}
            </p>
            <Button asChild>
              <Link href={`/reservations/${reservationId}`}>
                View Reservation
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const price = slot?.priceCents 
    ? `₱${(slot.priceCents / 100).toFixed(0)}`
    : "—";

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="-ml-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-heading font-bold">
          Complete Your Payment
        </h1>
        <p className="text-muted-foreground mt-1">
          Pay the court owner and mark your payment below
        </p>
      </div>

      {/* Reservation Details */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b">
            <div className="h-12 w-12 rounded-lg bg-primary-light flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-heading font-semibold">
                {slot && format(new Date(slot.startTime), "h:mm a")} - 
                {slot && format(new Date(slot.endTime), "h:mm a")}
              </div>
              <div className="text-sm text-muted-foreground">
                {slot && format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Amount Due</span>
            <span className="text-2xl font-heading font-bold text-primary">
              {price}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Instructions (Simplified) */}
      <Card className="mb-6 bg-muted/30">
        <CardContent className="p-6">
          <h3 className="font-heading font-semibold mb-3">
            How to Pay
          </h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-medium text-foreground">1.</span>
              Contact the court owner for payment details
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-foreground">2.</span>
              Pay via GCash, bank transfer, or cash
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-foreground">3.</span>
              Click "I Have Paid" below
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-foreground">4.</span>
              Wait for the owner to confirm your payment
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Mark Paid Button */}
      <Button
        onClick={handleMarkPaid}
        disabled={markPayment.isPending}
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

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        By clicking "I Have Paid", you confirm that you have completed 
        the payment to the court owner. The owner will verify your payment 
        and confirm your reservation.
      </p>

      {/* Cancel Option */}
      <div className="text-center mt-6">
        <Button variant="link" asChild className="text-muted-foreground">
          <Link href={`/reservations/${reservationId}`}>
            Cancel and view reservation
          </Link>
        </Button>
      </div>
    </div>
  );
}
```

---

## Success State (After Marking Paid)

Redirect to reservation detail page which should show:

```tsx
// In /reservations/[id]/page.tsx
{reservation?.status === "PAYMENT_MARKED_BY_USER" && (
  <Card className="bg-[#FFFBEB] border-[#D97706]/20">
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <Clock className="h-6 w-6 text-[#D97706] mt-0.5" />
        <div>
          <h3 className="font-heading font-semibold text-[#D97706]">
            Awaiting Owner Confirmation
          </h3>
          <p className="text-sm text-[#D97706]/80 mt-1">
            You've marked your payment as complete. The court owner will 
            review and confirm your reservation shortly.
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

---

## UI/UX Specifications

### Colors

| Element | Value |
|---------|-------|
| Amount badge | `text-primary` (`#0D9488`) |
| Success icon | `text-[#059669]` (success) |
| Warning banner | `bg-[#FFFBEB]`, `text-[#D97706]` |
| Instructions bg | `bg-muted/30` |

### Typography

| Element | Font | Weight |
|---------|------|--------|
| Page title | Outfit | 700 |
| Amount | Outfit | 700 |
| Section title | Outfit | 600 |
| Body text | Source Sans 3 | 400 |
| Disclaimer | Source Sans 3 | 400, 12px |

### Layout

| Property | Value |
|----------|-------|
| Max width | 32rem (`max-w-lg`) |
| Padding | 24px horizontal, 32px vertical |
| Card padding | 24px (`p-6`) |
| Button | Full width, large size |

---

## Status Handling

| Status | Behavior |
|--------|----------|
| `AWAITING_PAYMENT` | Show payment page normally |
| `PAYMENT_MARKED_BY_USER` | Show "already marked" message |
| `CONFIRMED` | Show "confirmed" message |
| `CANCELLED` | Show "cancelled" message |
| `EXPIRED` | Show "expired" message, option to rebook |

---

## Error Handling

```typescript
markPayment.mutate(
  { reservationId, termsAccepted: true },
  {
    onError: (error) => {
      if (error.message.includes("expired")) {
        toast.error("This reservation has expired. Please create a new one.");
        router.push("/courts");
      } else {
        toast.error(error.message || "Failed to mark payment");
      }
    },
  }
);
```

---

## Deferred Features

The following are NOT implemented (see `08-p2p-reservation-confirmation`):

| Feature | Status |
|---------|--------|
| 15-minute countdown timer | Deferred |
| Payment instructions (GCash/bank details) | Deferred |
| Reference number input | Deferred |
| Payment proof upload | Deferred |
| T&C explicit checkbox | Deferred (backend flag only) |

---

## Testing Checklist

### Happy Path
- [ ] Page loads with reservation details
- [ ] Amount displays correctly
- [ ] "I Have Paid" button works
- [ ] Status changes to PAYMENT_MARKED_BY_USER
- [ ] Redirect to reservation detail
- [ ] "Awaiting confirmation" message shows

### Edge Cases
- [ ] Already marked → shows appropriate message
- [ ] Already confirmed → shows confirmation
- [ ] Expired → shows error, option to rebook
- [ ] Not found → error state

### Visual
- [ ] Colors match design system
- [ ] Typography correct
- [ ] Mobile responsive
- [ ] Loading states visible

---

## Final Checklist

- [ ] Page renders correctly for AWAITING_PAYMENT
- [ ] Reservation details display (time, date, amount)
- [ ] "How to Pay" instructions clear
- [ ] "I Have Paid" button works
- [ ] Loading state during mutation
- [ ] Success redirect to reservation detail
- [ ] Error handling in place
- [ ] Already completed states handled
- [ ] Mobile responsive
- [ ] No TypeScript errors
