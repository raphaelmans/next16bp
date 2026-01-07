# UI Reservation - Booking & Payment Flow

**Phase:** UI-2  
**Backend Dependency:** Phase 3 (Reservation System)  
**Priority:** High - Core user journey

---

## Overview

The reservation module handles the complete booking flow from slot selection to payment confirmation. It includes the booking form, payment instructions, proof upload, and reservation management for players.

### Pages in This Module

| Page | Route | Auth | Description |
|------|-------|------|-------------|
| Book Slot | `/courts/[id]/book/[slotId]` | Required | Confirm booking |
| My Reservations | `/reservations` | Required | List all bookings |
| Reservation Detail | `/reservations/[id]` | Required | Single booking view |
| Payment | `/reservations/[id]/payment` | Required | Mark payment, upload proof |
| Profile | `/profile` | Required | Edit player profile |

---

## 1. Book Slot Page

### Route: `/courts/[id]/book/[slotId]`

### 1.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BREADCRUMB                                                            │
│  Home > Courts > {Court} > Book                                        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BOOKING CONFIRMATION                                                  │
│  ┌─────────────────────────────────────────┬────────────────────────────┐
│  │                                         │                            │
│  │  BOOKING SUMMARY CARD                   │  ORDER SUMMARY (sticky)    │
│  │  ┌─────────────────────────────────────┐│  ┌────────────────────────┐│
│  │  │ [Court Image]                       ││  │ Your Booking           ││
│  │  │                                     ││  │ ─────────────────────  ││
│  │  │ Court Name                          ││  │                        ││
│  │  │ 📍 Location                         ││  │ Date: Jan 15, 2025     ││
│  │  │                                     ││  │ Time: 6:00 - 7:00 AM   ││
│  │  │ ─────────────────────────────────── ││  │ Duration: 1 hour       ││
│  │  │                                     ││  │                        ││
│  │  │ 📅 Wednesday, January 15, 2025      ││  │ ─────────────────────  ││
│  │  │ 🕐 6:00 AM - 7:00 AM                ││  │                        ││
│  │  │                                     ││  │ Subtotal:    ₱200.00   ││
│  │  └─────────────────────────────────────┘│  │ ─────────────────────  ││
│  │                                         │  │ Total:       ₱200.00   ││
│  │  YOUR INFORMATION                       │  │                        ││
│  │  ┌─────────────────────────────────────┐│  │ [Confirm Booking]      ││
│  │  │                                     ││  │                        ││
│  │  │ Name: John Doe         [Edit]       ││  │ By confirming, you     ││
│  │  │ Email: john@email.com               ││  │ agree to our Terms     ││
│  │  │ Phone: +63 917 123 4567             ││  │ and Conditions         ││
│  │  │                                     ││  └────────────────────────┘│
│  │  │ ℹ️ This info will be shared with    ││                            │
│  │  │   the court owner                   ││                            │
│  │  └─────────────────────────────────────┘│                            │
│  │                                         │                            │
│  │  PAYMENT METHOD (if paid)               │                            │
│  │  ┌─────────────────────────────────────┐│                            │
│  │  │ Pay via:                            ││                            │
│  │  │ ○ GCash: 0917-123-4567              ││                            │
│  │  │ ○ Bank Transfer:                    ││                            │
│  │  │   BDO 1234-5678-9012                ││                            │
│  │  │   Account: Court Owner Name         ││                            │
│  │  │                                     ││                            │
│  │  │ ⚠️ You have 15 minutes to complete  ││                            │
│  │  │   payment after booking             ││                            │
│  │  └─────────────────────────────────────┘│                            │
│  │                                         │                            │
│  └─────────────────────────────────────────┴────────────────────────────┘
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  FOOTER                                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Breakdown

#### Booking Summary Card

```tsx
// src/features/reservation/components/booking-summary-card.tsx

interface BookingSummaryCardProps {
  court: CourtRecord
  slot: TimeSlotRecord
  photoUrl?: string
}

/* Specs:
 * - Border: border shadow-md rounded-xl
 * - Court image: aspect-[16/9], rounded-t-xl
 * - Court info: name, location
 * - Slot info: date formatted, time range
 * - Icon usage: Lucide icons (Calendar, Clock, MapPin)
 */
```

#### Profile Preview Card

```tsx
// src/features/reservation/components/profile-preview-card.tsx

interface ProfilePreviewCardProps {
  profile: ProfileRecord
  onEdit: () => void
}

/* Specs:
 * - Shows: displayName, email, phoneNumber
 * - Edit link: Opens profile edit modal or navigates
 * - Info note: Explains data sharing with owner
 * - Warning if profile incomplete
 */
```

#### Payment Info Card

```tsx
// src/features/reservation/components/payment-info-card.tsx

interface PaymentInfoCardProps {
  detail: ReservableCourtDetailRecord
  price: { cents: number; currency: string }
  ttlMinutes: number
}

/* Specs:
 * - Shows available payment methods
 * - GCash number with copy button
 * - Bank details with copy button
 * - TTL warning: warning-light background
 * - Payment instructions text
 */
```

#### Order Summary (Sticky)

```tsx
// src/features/reservation/components/order-summary.tsx

interface OrderSummaryProps {
  slot: TimeSlotRecord
  onConfirm: () => void
  isLoading: boolean
  isFree: boolean
}

/* Specs:
 * - Position: sticky top-24
 * - Date/time display
 * - Price breakdown
 * - Confirm button: primary, full width
 * - Terms checkbox (links to terms page)
 * - Loading state on button
 */
```

### 1.3 Flow Logic

```tsx
// src/features/reservation/hooks/use-create-reservation.ts

export function useCreateReservation() {
  const utils = trpc.useUtils()
  
  const mutation = trpc.reservation.create.useMutation({
    onSuccess: (data) => {
      // Invalidate slot availability
      utils.timeSlot.getAvailable.invalidate()
      
      // Navigate based on reservation type
      if (data.reservation.status === 'CONFIRMED') {
        // Free court - go to confirmation
        router.push(`/reservations/${data.reservation.id}`)
      } else {
        // Paid court - go to payment page
        router.push(`/reservations/${data.reservation.id}/payment`)
      }
    },
  })

  return mutation
}
```

---

## 2. My Reservations Page

### Route: `/reservations`

### 2.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PAGE HEADER                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  My Reservations                                                    ││
│  │  View and manage your court bookings                                ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TABS                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ [Upcoming (3)] [Past] [Cancelled]                                   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  RESERVATION LIST                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ ┌─────────────────────────────────────────────────────────────────┐ ││
│  │ │ [Image] Court Name           Wed, Jan 15 │ AWAITING   │ ₱200   │ ││
│  │ │         📍 Location          6:00 AM     │ PAYMENT    │        │ ││
│  │ │                                          │ [Pay Now]  │ [View] │ ││
│  │ └─────────────────────────────────────────────────────────────────┘ ││
│  │                                                                     ││
│  │ ┌─────────────────────────────────────────────────────────────────┐ ││
│  │ │ [Image] Another Court        Thu, Jan 16 │ CONFIRMED  │ FREE   │ ││
│  │ │         📍 Location          9:00 AM     │            │        │ ││
│  │ │                                          │            │ [View] │ ││
│  │ └─────────────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  EMPTY STATE (if no reservations)                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │         [Calendar Icon]                                             ││
│  │         No upcoming reservations                                    ││
│  │         Find and book a court to get started                        ││
│  │                                                                     ││
│  │         [Find Courts]                                               ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  FOOTER                                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Reservation List Item

```tsx
// src/features/reservation/components/reservation-list-item.tsx

interface ReservationListItemProps {
  reservation: ReservationWithSlot
}

/* Specs:
 * - Layout: Horizontal card with image, info, status, actions
 * - Image: aspect-square, 80px, rounded-lg
 * - Status badge: Color-coded by status
 * - Actions: Context-appropriate (Pay Now, View, Cancel)
 * - Mobile: Stack vertically
 */
```

### 2.3 Status Badge Mapping

| Status | Badge Variant | Color | Label |
|--------|---------------|-------|-------|
| `CREATED` | `default` | primary | "Processing" |
| `AWAITING_PAYMENT` | `warning` | warning | "Awaiting Payment" |
| `PAYMENT_MARKED_BY_USER` | `default` | primary | "Payment Pending" |
| `CONFIRMED` | `success` | success | "Confirmed" |
| `EXPIRED` | `destructive` | destructive | "Expired" |
| `CANCELLED` | `secondary` | muted | "Cancelled" |

### 2.4 URL State (Tabs)

```tsx
// src/features/reservation/hooks/use-reservations-tabs.ts

import { parseAsString, useQueryState } from 'nuqs'

export function useReservationsTabs() {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsString.withDefault('upcoming')
  )

  return { tab, setTab }
}
```

---

## 3. Reservation Detail Page

### Route: `/reservations/[id]`

### 3.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BREADCRUMB                                                            │
│  My Reservations > Reservation #{id}                                   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  STATUS BANNER (conditional)                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ ⚠️ AWAITING PAYMENT - You have 12:34 remaining to complete payment ││
│  │    [Complete Payment]                                               ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  RESERVATION CONTENT                                                   │
│  ┌─────────────────────────────────────────┬────────────────────────────┐
│  │                                         │                            │
│  │  BOOKING DETAILS                        │  ACTIONS CARD (sticky)     │
│  │  ┌─────────────────────────────────────┐│  ┌────────────────────────┐│
│  │  │ [Court Photo Gallery]               ││  │ Status: CONFIRMED ✓   ││
│  │  │                                     ││  │                        ││
│  │  │ Court Name                          ││  │ Booking ID:            ││
│  │  │ 📍 Address                          ││  │ #ABC-123-XYZ           ││
│  │  │                                     ││  │                        ││
│  │  │ ─────────────────────────────────── ││  │ [Get Directions]       ││
│  │  │                                     ││  │ [Contact Owner]        ││
│  │  │ 📅 Wednesday, January 15, 2025      ││  │                        ││
│  │  │ 🕐 6:00 AM - 7:00 AM                ││  │ ─────────────────────  ││
│  │  │ 💰 ₱200.00                          ││  │                        ││
│  │  │                                     ││  │ [Cancel Reservation]   ││
│  │  └─────────────────────────────────────┘│  │ (if cancellable)       ││
│  │                                         │  └────────────────────────┘│
│  │  YOUR BOOKING INFO (PRD 8.5 Snapshot)   │                            │
│  │  ┌─────────────────────────────────────┐│                            │
│  │  │ Your info at time of booking:       ││                            │
│  │  │ Name: John Doe                      ││                            │
│  │  │ Email: john@email.com               ││                            │
│  │  │ Phone: +63 917 123 4567             ││                            │
│  │  │                                     ││                            │
│  │  │ ℹ️ This info was shared with owner  ││                            │
│  │  └─────────────────────────────────────┘│                            │
│  │                                         │                            │
│  │  ORGANIZATION INFO                      │                            │
│  │  ┌─────────────────────────────────────┐│                            │
│  │  │ [Logo] Organization Name            ││                            │
│  │  │        📧 contact@org.com           ││                            │
│  │  │        📱 +63 917 123 4567          ││                            │
│  │  └─────────────────────────────────────┘│                            │
│  │                                         │                            │
│  │  PAYMENT PROOF (if uploaded)            │                            │
│  │  ┌─────────────────────────────────────┐│                            │
│  │  │ Payment Reference: GC-123456        ││                            │
│  │  │ Uploaded: Jan 15, 2025 10:30 AM     ││                            │
│  │  │ [View Receipt Image]                ││                            │
│  │  └─────────────────────────────────────┘│                            │
│  │                                         │                            │
│  │  TIMELINE                               │                            │
│  │  ┌─────────────────────────────────────┐│                            │
│  │  │ ● Confirmed      Jan 15, 10:45 AM   ││                            │
│  │  │ │                Owner confirmed    ││                            │
│  │  │ ● Payment Marked Jan 15, 10:30 AM   ││                            │
│  │  │ │                You marked payment ││                            │
│  │  │ ● Created        Jan 15, 10:00 AM   ││                            │
│  │  │                  Booking created    ││                            │
│  │  └─────────────────────────────────────┘│                            │
│  │                                         │                            │
│  └─────────────────────────────────────────┴────────────────────────────┘
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  FOOTER                                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Status Banner Component

```tsx
// src/features/reservation/components/status-banner.tsx

interface StatusBannerProps {
  status: ReservationStatus
  expiresAt?: Date
}

/* Banner Variants:
 * - AWAITING_PAYMENT: warning bg, countdown timer, Pay Now CTA
 * - PAYMENT_MARKED_BY_USER: primary-light bg, "Waiting for confirmation"
 * - CONFIRMED: success-light bg, checkmark, confirmation message
 * - EXPIRED: destructive-light bg, error message
 * - CANCELLED: muted bg, cancellation reason
 */
```

### 3.3 Countdown Timer

```tsx
// src/features/reservation/components/countdown-timer.tsx

interface CountdownTimerProps {
  expiresAt: Date
  onExpire: () => void
}

/* Specs:
 * - Format: "12:34" or "12 minutes remaining"
 * - Color: warning when < 5 min, destructive when < 2 min
 * - Auto-refresh every second
 * - Calls onExpire when timer reaches 0
 */
```

### 3.4 Timeline Component

```tsx
// src/features/reservation/components/reservation-timeline.tsx

interface ReservationTimelineProps {
  events: ReservationEventRecord[]
}

/* Specs:
 * - Vertical timeline with dots and lines
 * - Dot color based on event type
 * - Show: status change, actor, timestamp, notes
 * - Most recent first
 */
```

---

## 4. Payment Page

### Route: `/reservations/[id]/payment`

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TIMER BANNER                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ ⏱️ Complete payment within: 12:34                                   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PAYMENT CONTENT                                                       │
│  ┌─────────────────────────────────────────┬────────────────────────────┐
│  │                                         │                            │
│  │  STEP INDICATOR                         │  ORDER SUMMARY             │
│  │  [1. Review] → [2. Pay] → [3. Confirm]  │  ┌────────────────────────┐│
│  │                                         │  │ Court Name             ││
│  │                                         │  │ Jan 15, 6:00-7:00 AM   ││
│  │  PAYMENT INSTRUCTIONS                   │  │                        ││
│  │  ┌─────────────────────────────────────┐│  │ Total: ₱200.00         ││
│  │  │                                     ││  └────────────────────────┘│
│  │  │ Send ₱200.00 to:                    ││                            │
│  │  │                                     ││                            │
│  │  │ ┌───────────────────────────────┐   ││                            │
│  │  │ │ GCash                         │   ││                            │
│  │  │ │ 0917-123-4567                 │   ││                            │
│  │  │ │ Account: Court Owner    [📋] │   ││                            │
│  │  │ └───────────────────────────────┘   ││                            │
│  │  │                                     ││                            │
│  │  │ ┌───────────────────────────────┐   ││                            │
│  │  │ │ Bank Transfer                 │   ││                            │
│  │  │ │ BDO: 1234-5678-9012          │   ││                            │
│  │  │ │ Account: Court Owner    [📋] │   ││                            │
│  │  │ └───────────────────────────────┘   ││                            │
│  │  │                                     ││                            │
│  │  │ Special Instructions:               ││                            │
│  │  │ "Include your booking ID in the     ││                            │
│  │  │  payment reference"                 ││                            │
│  │  │                                     ││                            │
│  │  └─────────────────────────────────────┘│                            │
│  │                                         │                            │
│  │  PAYMENT PROOF (Optional)               │                            │
│  │  ┌─────────────────────────────────────┐│                            │
│  │  │                                     ││                            │
│  │  │ Reference Number:                   ││                            │
│  │  │ ┌───────────────────────────────┐   ││                            │
│  │  │ │ e.g., GCash ref or bank ref   │   ││                            │
│  │  │ └───────────────────────────────┘   ││                            │
│  │  │                                     ││                            │
│  │  │ Upload Receipt (optional):          ││                            │
│  │  │ ┌───────────────────────────────┐   ││                            │
│  │  │ │  [📷 Click to upload]         │   ││                            │
│  │  │ │  PNG, JPG up to 5MB           │   ││                            │
│  │  │ └───────────────────────────────┘   ││                            │
│  │  │                                     ││                            │
│  │  │ Notes (optional):                   ││                            │
│  │  │ ┌───────────────────────────────┐   ││                            │
│  │  │ │                               │   ││                            │
│  │  │ └───────────────────────────────┘   ││                            │
│  │  │                                     ││                            │
│  │  └─────────────────────────────────────┘│                            │
│  │                                         │                            │
│  │  PAYMENT DISCLAIMER (PRD Section 17)    │                            │
│  │  ┌─────────────────────────────────────┐│                            │
│  │  │ ⚠️ Important Notice:                ││                            │
│  │  │                                     ││                            │
│  │  │ KudosCourts does not process or     ││                            │
│  │  │ verify payments. All payments are   ││                            │
│  │  │ made directly to the court owner.   ││                            │
│  │  │ Payment disputes are between you    ││                            │
│  │  │ and the court owner.                ││                            │
│  │  └─────────────────────────────────────┘│                            │
│  │                                         │                            │
│  │  CONFIRMATION                           │                            │
│  │  ┌─────────────────────────────────────┐│                            │
│  │  │ ☐ I have completed the payment      ││                            │
│  │  │                                     ││                            │
│  │  │ ☐ I acknowledge that KudosCourts    ││                            │
│  │  │   does not process payments and     ││                            │
│  │  │   is not liable for disputes        ││                            │
│  │  │   (required)                        ││                            │
│  │  │                                     ││                            │
│  │  │ ☐ I agree to the Terms and          ││                            │
│  │  │   Conditions (required)             ││                            │
│  │  │                                     ││                            │
│  │  │ [Mark Payment as Complete]          ││                            │
│  │  └─────────────────────────────────────┘│                            │
│  │                                         │                            │
│  └─────────────────────────────────────────┴────────────────────────────┘
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  FOOTER                                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Payment Disclaimer Component

```tsx
// src/features/reservation/components/payment-disclaimer.tsx

/* Specs (PRD Section 17.2):
 * - Background: warning-light
 * - Border: border-warning/50
 * - Icon: AlertTriangle (Lucide)
 * - Text clearly states:
 *   - KudosCourts does not process or verify payments
 *   - Payment disputes are between player and court owner
 *   - KudosCourts is not liable for booking disputes
 */

export function PaymentDisclaimer() {
  return (
    <Alert variant="warning" className="bg-warning-light border-warning/50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Important Notice</AlertTitle>
      <AlertDescription>
        KudosCourts does not process or verify payments. All payments are 
        made directly to the court owner through external channels (GCash, 
        bank transfer, etc.). Any payment disputes are between you and the 
        court owner. KudosCourts is not liable for booking or payment disputes.
      </AlertDescription>
    </Alert>
  )
}
```

### 4.3 Payment Method Card

```tsx
// src/features/reservation/components/payment-method-card.tsx

interface PaymentMethodCardProps {
  type: 'gcash' | 'bank'
  details: {
    number: string
    accountName: string
    bankName?: string
  }
}

/* Specs:
 * - Border: border rounded-lg p-4
 * - Icon: Payment method logo/icon
 * - Copy button: Copies number to clipboard
 * - Toast on copy: "Copied to clipboard"
 */
```

### 4.3 File Upload Component

```tsx
// src/features/reservation/components/file-upload.tsx

interface FileUploadProps {
  onUpload: (url: string) => void
  accept?: string
  maxSizeMB?: number
}

/* Specs:
 * - Drag and drop zone
 * - Click to browse
 * - Preview uploaded image
 * - Progress indicator
 * - Error state for invalid files
 * - Delete uploaded file option
 */
```

### 4.5 Mark Payment Form

```tsx
// src/features/reservation/schemas/mark-payment.schema.ts

import { z } from 'zod'

export const markPaymentSchema = z.object({
  referenceNumber: z.string().max(100).optional(),
  fileUrl: z.string().url().optional(),
  notes: z.string().max(500).optional(),
  // PRD Section 17.3 - Required acknowledgements
  disclaimerAcknowledged: z.literal(true, {
    errorMap: () => ({ message: 'You must acknowledge the payment disclaimer' }),
  }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms and Conditions' }),
  }),
  paymentCompleted: z.literal(true, {
    errorMap: () => ({ message: 'Please confirm you have completed payment' }),
  }),
}).refine(
  (data) => data.referenceNumber || data.fileUrl,
  { message: 'Please provide a reference number or upload a receipt' }
)

/* PRD Section 17.3 - User Acknowledgement:
 * Before marking payment as complete, players must:
 * 1. Accept Terms & Conditions via explicit checkbox
 * 2. Acknowledge the payment disclaimer (KudosCourts not liable)
 * 
 * PRD Section 17.4 - Audit Trail:
 * - All payment confirmations are logged
 * - Player acknowledgement timestamp preserved
 */
```

---

## 5. Profile Page

### Route: `/profile`

### 5.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PAGE HEADER                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  My Profile                                                         ││
│  │  Manage your personal information                                   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PROFILE FORM                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Avatar                                                             ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │  [Avatar Preview]    [Change Avatar]                          │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Display Name *                                                     ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ John Doe                                                      │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Email                                                              ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ john@email.com                                                │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Phone Number                                                       ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ +63 917 123 4567                                              │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  ℹ️ Your contact information may be shared with court owners       ││
│  │     when you make a reservation.                                   ││
│  │                                                                     ││
│  │  [Save Changes]                                                     ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  FOOTER                                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Profile Form Schema

```tsx
// src/features/reservation/schemas/profile.schema.ts

import { z } from 'zod'

export const profileSchema = z.object({
  displayName: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phoneNumber: z.string().max(20).optional().or(z.literal('')),
  avatarUrl: z.string().url().optional().or(z.literal('')),
})
```

---

## 6. Hooks & Data Fetching

### 6.1 Reservation Hooks

```tsx
// src/features/reservation/hooks/index.ts

// Get player's reservations
export function useMyReservations(filters: { status?: string; upcoming?: boolean }) {
  return trpc.reservation.getMy.useQuery(filters)
}

// Get single reservation
export function useReservation(id: string) {
  return trpc.reservation.getById.useQuery({ id })
}

// Create reservation mutation
export function useCreateReservation() {
  return trpc.reservation.create.useMutation()
}

// Mark payment mutation
export function useMarkPayment() {
  return trpc.reservation.markPayment.useMutation()
}

// Cancel reservation mutation
export function useCancelReservation() {
  return trpc.reservation.cancel.useMutation()
}

// Payment proof mutations
export function useAddPaymentProof() {
  return trpc.paymentProof.add.useMutation()
}
```

### 6.2 Profile Hooks

```tsx
// src/features/reservation/hooks/use-profile.ts

export function useProfile() {
  return trpc.profile.me.useQuery()
}

export function useUpdateProfile() {
  return trpc.profile.update.useMutation()
}
```

---

## 7. Implementation Checklist

### 7.1 Book Slot Page

- [ ] Booking summary card
- [ ] Profile preview with edit link
- [ ] Payment methods display
- [ ] Order summary (sticky)
- [ ] Terms checkbox
- [ ] Confirm booking mutation
- [ ] Loading states
- [ ] Error handling
- [ ] Success redirect

### 7.2 My Reservations Page

- [ ] Tab navigation (URL state)
- [ ] Reservation list items
- [ ] Status badges
- [ ] Contextual actions
- [ ] Empty states per tab
- [ ] Loading skeletons
- [ ] Pagination

### 7.3 Reservation Detail Page

- [ ] Status banner with timer
- [ ] Booking details card
- [ ] Player snapshot display (PRD 8.5)
- [ ] Organization info
- [ ] Payment proof display
- [ ] Timeline component
- [ ] Action buttons (cancel, contact)
- [ ] Get directions link

### 7.4 Payment Page

- [ ] Countdown timer
- [ ] Payment instructions
- [ ] Copy to clipboard
- [ ] Payment disclaimer component (PRD 17.2)
- [ ] Payment proof form
- [ ] File upload
- [ ] Disclaimer acknowledgement checkbox (PRD 17.3)
- [ ] T&C checkbox (PRD 17.3)
- [ ] Mark payment mutation
- [ ] Validation with required acknowledgements
- [ ] Success state

### 7.5 Profile Page

- [ ] Profile form
- [ ] Avatar upload
- [ ] Form validation
- [ ] Update mutation
- [ ] Success toast
- [ ] Loading states

---

## 8. Error States

### 8.1 Slot Already Booked

```tsx
// Shown when attempting to book an already-taken slot
<Alert variant="destructive">
  <AlertTitle>Slot No Longer Available</AlertTitle>
  <AlertDescription>
    This time slot has been booked by another player. 
    Please select a different time.
  </AlertDescription>
  <Button variant="outline" onClick={() => router.back()}>
    Choose Another Slot
  </Button>
</Alert>
```

### 8.2 Payment Expired

```tsx
// Shown when payment TTL expires
<Alert variant="destructive">
  <AlertTitle>Payment Time Expired</AlertTitle>
  <AlertDescription>
    The payment window for this reservation has expired. 
    The slot has been released and you'll need to make a new booking.
  </AlertDescription>
  <Button onClick={() => router.push(`/courts/${courtId}`)}>
    Book Again
  </Button>
</Alert>
```

---

*End of UI Reservation*
