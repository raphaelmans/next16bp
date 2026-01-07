# UI Owner - Court Owner Dashboard

**Phase:** UI-3  
**Backend Dependency:** Phase 2 (Court Management), Phase 3B (Reservation Owner)  
**Priority:** Medium - Secondary user flow

---

## Overview

The owner dashboard enables court owners to manage their courts, time slots, and reservations. It provides tools for creating courts, managing availability, and confirming/rejecting player bookings.

### Pages in This Module

| Page | Route | Description |
|------|-------|-------------|
| Owner Dashboard | `/owner` | Overview with pending actions |
| My Courts | `/owner/courts` | List organization's courts |
| Create Court | `/owner/courts/new` | Create new court |
| Edit Court | `/owner/courts/[id]/edit` | Manage court details |
| Manage Slots | `/owner/courts/[id]/slots` | Time slot management |
| Reservations | `/owner/reservations` | Pending confirmations |
| Organization Settings | `/owner/settings` | Edit org profile |
| Claim Court | `/owner/claim/[courtId]` | Submit claim request |

---

## 1. Owner Dashboard

### Route: `/owner`

### 1.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OWNER NAVBAR (with org switcher if multiple)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SIDEBAR              │  MAIN CONTENT                                   │
│  ┌─────────────────┐  │  ┌───────────────────────────────────────────┐  │
│  │ Dashboard       │  │  │ Welcome back, {Name}                     │  │
│  │ My Courts       │  │  │ Here's what's happening with your courts │  │
│  │ Reservations    │  │  └───────────────────────────────────────────┘  │
│  │ Settings        │  │                                                │
│  │                 │  │  STATS CARDS                                   │
│  │ ─────────────── │  │  ┌──────────┬──────────┬──────────┬──────────┐│
│  │                 │  │  │ Active   │ Pending  │ Today's  │ Revenue  ││
│  │ Organization:   │  │  │ Courts   │ Bookings │ Bookings │ (Month)  ││
│  │ [Org Name ▼]    │  │  │    3     │    5     │    8     │ ₱12,400  ││
│  │                 │  │  └──────────┴──────────┴──────────┴──────────┘│
│  │                 │  │                                                │
│  │                 │  │  ACTION REQUIRED                               │
│  │                 │  │  ┌───────────────────────────────────────────┐ │
│  │                 │  │  │ 🔔 5 bookings awaiting confirmation       │ │
│  │                 │  │  │    [Review Now]                           │ │
│  │                 │  │  └───────────────────────────────────────────┘ │
│  │                 │  │                                                │
│  │                 │  │  RECENT ACTIVITY                              │
│  │                 │  │  ┌───────────────────────────────────────────┐ │
│  │                 │  │  │ ● New booking - Court A, Jan 15 6AM      │ │
│  │                 │  │  │ ● Payment confirmed - Court B, Jan 14    │ │
│  │                 │  │  │ ● Slot blocked - Court A, Jan 20         │ │
│  │                 │  │  └───────────────────────────────────────────┘ │
│  │                 │  │                                                │
│  │                 │  │  UPCOMING TODAY                               │
│  │                 │  │  ┌───────────────────────────────────────────┐ │
│  │                 │  │  │ [Timeline of today's bookings]            │ │
│  │                 │  │  └───────────────────────────────────────────┘ │
│  │                 │  │                                                │
│  └─────────────────┘  │                                                │
│                       │                                                │
├───────────────────────┴────────────────────────────────────────────────┤
│  FOOTER                                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Stats Card Component

```tsx
// src/features/owner/components/stats-card.tsx

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  href?: string
}

/* Specs:
 * - Border: border rounded-xl shadow-sm
 * - Icon: bg-primary-light/10, rounded-lg
 * - Value: Outfit 700, text-2xl
 * - Trend: Small text, green/red color
 * - Clickable: cursor-pointer, hover:shadow-md
 */
```

### 1.3 Pending Actions Alert

```tsx
// src/features/owner/components/pending-actions.tsx

interface PendingActionsProps {
  pendingCount: number
}

/* Specs:
 * - Background: warning-light
 * - Border: border-warning
 * - Icon: Bell/AlertCircle
 * - CTA: Secondary button
 * - Hide if count is 0
 */
```

---

## 2. My Courts Page

### Route: `/owner/courts`

### 2.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OWNER NAVBAR + SIDEBAR                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PAGE HEADER                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  My Courts                                     [+ Add New Court]    ││
│  │  Manage your court listings                                         ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  COURTS TABLE                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ ┌───────┬──────────────┬──────────┬──────────┬─────────┬─────────┐ ││
│  │ │       │ Name         │ Location │ Status   │ Slots   │ Actions │ ││
│  │ ├───────┼──────────────┼──────────┼──────────┼─────────┼─────────┤ ││
│  │ │ [Img] │ Court A      │ Manila   │ ● Active │ 24 open │ [...]   │ ││
│  │ │ [Img] │ Court B      │ Quezon   │ ● Active │ 18 open │ [...]   │ ││
│  │ │ [Img] │ Court C      │ Manila   │ ○ Draft  │ 0 slots │ [...]   │ ││
│  │ └───────┴──────────────┴──────────┴──────────┴─────────┴─────────┘ ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  EMPTY STATE (if no courts)                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │         [Court Icon]                                                ││
│  │         No courts yet                                               ││
│  │         Add your first court to start accepting bookings            ││
│  │                                                                     ││
│  │         [+ Add Your First Court]                                    ││
│  │                                                                     ││
│  │         ── or ──                                                    ││
│  │                                                                     ││
│  │         [Claim an Existing Court]                                   ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Courts Table Actions

```tsx
// Action menu for each court row
const courtActions = [
  { label: 'Edit Details', href: `/owner/courts/${id}/edit` },
  { label: 'Manage Slots', href: `/owner/courts/${id}/slots` },
  { label: 'View Bookings', href: `/owner/reservations?court=${id}` },
  { label: 'View Public Page', href: `/courts/${id}`, external: true },
  { type: 'separator' },
  { label: 'Deactivate', variant: 'destructive', action: 'deactivate' },
]
```

---

## 3. Create/Edit Court Page

### Route: `/owner/courts/new` and `/owner/courts/[id]/edit`

### 3.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OWNER NAVBAR + SIDEBAR                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PAGE HEADER                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Create New Court / Edit Court                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FORM TABS                                                             │
│  [Basic Info] [Location] [Photos] [Amenities] [Payment]                │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BASIC INFO TAB                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Court Name *                                                       ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ My Awesome Pickleball Court                                   │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Number of Courts                                                   ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ 4                                                             │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Operating Hours                                                    ││
│  │  ┌─────────────────┐  to  ┌─────────────────┐                       ││
│  │  │ 6:00 AM         │      │ 10:00 PM        │                       ││
│  │  └─────────────────┘      └─────────────────┘                       ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  LOCATION TAB                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Address *                                                          ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ 123 Main Street, Barangay XYZ                                 │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  City *                                                             ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ Manila                                          ▼              │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Pin Location on Map                                                ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │                                                               │  ││
│  │  │   [Interactive Map - Click to set pin]                        │  ││
│  │  │                                                               │  ││
│  │  │   Lat: 14.5995   Lng: 120.9842                               │  ││
│  │  │                                                               │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  PHOTOS TAB                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Court Photos (max 10)                                              ││
│  │                                                                     ││
│  │  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────────────┐                ││
│  │  │ [Img] │  │ [Img] │  │ [Img] │  │ + Add Photo   │                ││
│  │  │  [×]  │  │  [×]  │  │  [×]  │  │               │                ││
│  │  └───────┘  └───────┘  └───────┘  └───────────────┘                ││
│  │                                                                     ││
│  │  Drag to reorder. First photo will be the cover image.             ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  AMENITIES TAB                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Select available amenities:                                        ││
│  │                                                                     ││
│  │  ☑ Parking        ☑ Restrooms       ☑ Lights                       ││
│  │  ☑ Showers        ☐ Locker Rooms    ☑ Equipment Rental             ││
│  │  ☐ Pro Shop       ☑ Seating Area    ☐ Food/Drinks                  ││
│  │                                                                     ││
│  │  Custom Amenities:                                                  ││
│  │  ┌───────────────────────────────────────┐  [+ Add]                 ││
│  │  │ e.g., Ball Machine                    │                          ││
│  │  └───────────────────────────────────────┘                          ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  PAYMENT TAB                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Pricing                                                            ││
│  │  ○ Free Court (no payment required)                                 ││
│  │  ● Paid Court                                                       ││
│  │                                                                     ││
│  │  Default Hourly Rate *                                              ││
│  │  ┌─────────┐  ┌─────────┐                                           ││
│  │  │ ₱       │  │ 200     │  per hour                                 ││
│  │  └─────────┘  └─────────┘                                           ││
│  │                                                                     ││
│  │  Payment Instructions                                               ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ Please include your booking ID in the payment reference...    │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Payment Methods                                                    ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ ☑ GCash                                                       │  ││
│  │  │   Number: [0917-123-4567                              ]       │  ││
│  │  │                                                               │  ││
│  │  │ ☑ Bank Transfer                                               │  ││
│  │  │   Bank:   [BDO                                        ▼]       │  ││
│  │  │   Account:[1234-5678-9012                             ]       │  ││
│  │  │   Name:   [Court Owner Name                           ]       │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  FORM ACTIONS                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                     [Cancel]  [Save as Draft]       ││
│  │                                               [Publish Court]       ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Form Schema

```tsx
// src/features/owner/schemas/court-form.schema.ts

import { z } from 'zod'

export const courtFormSchema = z.object({
  // Basic Info
  name: z.string().min(1, 'Name is required').max(200),
  numberOfCourts: z.number().int().min(1).default(1),
  
  // Location
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required').max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  
  // Payment (for reservable courts)
  isFree: z.boolean().default(false),
  defaultPriceCents: z.number().int().min(0).optional(),
  defaultCurrency: z.string().length(3).default('PHP'),
  paymentInstructions: z.string().max(1000).optional(),
  gcashNumber: z.string().max(20).optional(),
  bankName: z.string().max(100).optional(),
  bankAccountNumber: z.string().max(50).optional(),
  bankAccountName: z.string().max(150).optional(),
  
  // Photos
  photos: z.array(z.object({
    url: z.string().url(),
    displayOrder: z.number().int().min(0),
  })).max(10).optional(),
  
  // Amenities
  amenities: z.array(z.string().max(100)).optional(),
})
```

---

## 4. Manage Slots Page

### Route: `/owner/courts/[id]/slots`

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OWNER NAVBAR + SIDEBAR                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PAGE HEADER                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Manage Time Slots - {Court Name}         [+ Add Slots]             ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  DATE NAVIGATION                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  [<]  January 2025  [>]                     [Today] [Week] [Month] ││
│  │                                                                     ││
│  │  Sun   Mon   Tue   Wed   Thu   Fri   Sat                           ││
│  │   -     -     -    [1]   [2]   [3]   [4]                           ││
│  │  [5]   [6]   [7]   [8]   [9]   [10]  [11]                          ││
│  │  [12]  [13]  [14]  ●15   [16]  [17]  [18]  ← Today                 ││
│  │  [19]  [20]  [21]  [22]  [23]  [24]  [25]                          ││
│  │  [26]  [27]  [28]  [29]  [30]  [31]   -                            ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SLOTS FOR SELECTED DATE (January 15, 2025)                            │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  6:00 AM    ┌────────────────────────────────────────────┐         ││
│  │  1 hour     │ ● Available    ₱200           [Block] [×]  │         ││
│  │             └────────────────────────────────────────────┘         ││
│  │                                                                     ││
│  │  7:00 AM    ┌────────────────────────────────────────────┐         ││
│  │  1 hour     │ ● Booked      John Doe       [View]        │         ││
│  │             │               +63 917 XXX                   │         ││
│  │             └────────────────────────────────────────────┘         ││
│  │                                                                     ││
│  │  8:00 AM    ┌────────────────────────────────────────────┐         ││
│  │  1 hour     │ ⏳ Pending     Maria S.       [Confirm] [×] │         ││
│  │             │               Payment marked                │         ││
│  │             └────────────────────────────────────────────┘         ││
│  │                                                                     ││
│  │  9:00 AM    ┌────────────────────────────────────────────┐         ││
│  │  1 hour     │ 🚫 Blocked                   [Unblock]      │         ││
│  │             └────────────────────────────────────────────┘         ││
│  │                                                                     ││
│  │  10:00 AM   ┌────────────────────────────────────────────┐         ││
│  │  No slot    │ No slot created              [+ Add Slot]  │         ││
│  │             └────────────────────────────────────────────┘         ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Bulk Slot Creation Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Add Time Slots                                                    [×] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Create slots for:                                                     │
│  ○ Single Day                                                          │
│  ● Multiple Days (recurring)                                           │
│                                                                         │
│  Date Range                                                            │
│  ┌─────────────────────┐  to  ┌─────────────────────┐                  │
│  │ Jan 15, 2025        │      │ Jan 31, 2025        │                  │
│  └─────────────────────┘      └─────────────────────┘                  │
│                                                                         │
│  Days of Week                                                          │
│  ☑ Mon  ☑ Tue  ☑ Wed  ☑ Thu  ☑ Fri  ☐ Sat  ☐ Sun                      │
│                                                                         │
│  Time Slots                                                            │
│  Start Time: [6:00 AM  ▼]  End Time: [10:00 PM ▼]                      │
│  Duration:   [1 hour   ▼]                                              │
│                                                                         │
│  Pricing                                                               │
│  ☑ Use default price (₱200/hour)                                       │
│  ○ Custom price: ₱[___] per hour                                       │
│                                                                         │
│  Preview: This will create 16 slots per day (6AM-10PM)                 │
│           Total: 176 slots across 11 days                              │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                              [Cancel]  [Create Slots]  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Slot Item Component

```tsx
// src/features/owner/components/slot-item.tsx

interface SlotItemProps {
  slot: TimeSlotRecord
  reservation?: ReservationWithPlayer
  onBlock: () => void
  onUnblock: () => void
  onConfirm: () => void
  onReject: () => void
  onDelete: () => void
}

/* Slot States:
 * - AVAILABLE: Green dot, Block/Delete actions
 * - HELD: Yellow dot, player info, TTL countdown
 * - BOOKED: Blue dot, player info, View action
 * - BLOCKED: Gray dot, Unblock action
 */
```

---

## 5. Reservations Page (Owner View)

### Route: `/owner/reservations`

### 5.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OWNER NAVBAR + SIDEBAR                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PAGE HEADER                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Reservations                                                       ││
│  │  Manage bookings for your courts                                    ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FILTERS                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ [All Courts ▼] [All Status ▼] [Date Range]        [Search player]  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TABS                                                                  │
│  [Pending Action (5)] [Upcoming] [Past] [Cancelled]                    │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  RESERVATIONS TABLE                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ ┌─────────┬────────────┬───────────┬──────────┬─────────┬────────┐ ││
│  │ │ Court   │ Player     │ Date/Time │ Amount   │ Status  │ Action │ ││
│  │ ├─────────┼────────────┼───────────┼──────────┼─────────┼────────┤ ││
│  │ │ Court A │ John Doe   │ Jan 15    │ ₱200     │ PENDING │ [✓][×] │ ││
│  │ │         │ 0917-XXX   │ 6:00 AM   │          │ CONFIRM │        │ ││
│  │ ├─────────┼────────────┼───────────┼──────────┼─────────┼────────┤ ││
│  │ │ Court B │ Maria S.   │ Jan 15    │ ₱200     │ PENDING │ [✓][×] │ ││
│  │ │         │ 0918-XXX   │ 8:00 AM   │          │ CONFIRM │        │ ││
│  │ └─────────┴────────────┴───────────┴──────────┴─────────┴────────┘ ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  EXPANDED ROW (when clicked)                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Player Details:                                                     ││
│  │ Name: John Doe                                                      ││
│  │ Email: john@email.com                                               ││
│  │ Phone: +63 917 123 4567                                             ││
│  │                                                                     ││
│  │ Payment Proof:                                                      ││
│  │ Reference: GC-123456                                                ││
│  │ [View Receipt Image]                                                ││
│  │                                                                     ││
│  │ Notes: "Paid via GCash"                                             ││
│  │                                                                     ││
│  │ [Confirm Payment]  [Reject with Reason]                             ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Confirm/Reject Actions

```tsx
// src/features/owner/components/reservation-actions.tsx

// Confirm action
const handleConfirm = async (reservationId: string) => {
  await confirmMutation.mutateAsync({ reservationId })
  toast.success('Booking confirmed!')
}

// Reject action (requires reason)
const handleReject = async (reservationId: string, reason: string) => {
  await rejectMutation.mutateAsync({ reservationId, reason })
  toast.success('Booking rejected')
}
```

---

## 6. Organization Settings Page

### Route: `/owner/settings`

### 6.1 Layout Structure (Including Removal Request - PRD 6.3)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OWNER NAVBAR + SIDEBAR                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PAGE HEADER                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Organization Settings                                              ││
│  │  Manage your organization profile                                   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SETTINGS FORM                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Organization Logo                                                  ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │  [Logo Preview]    [Change Logo]                              │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Organization Name *                                                ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ My Pickleball Club                                            │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  URL Slug *                                                         ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ kudoscourts.com/org/  my-pickleball-club                      │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Description                                                        ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ We are a premier pickleball facility in Metro Manila...       │  ││
│  │  │                                                               │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Contact Information                                                ││
│  │  Email:    [contact@mypickleballclub.com                     ]     ││
│  │  Phone:    [+63 917 123 4567                                 ]     ││
│  │  Address:  [123 Main Street, Manila                          ]     ││
│  │                                                                     ││
│  │  [Save Changes]                                                     ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  DANGER ZONE (PRD Section 6.3)                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Request Listing Removal                                            ││
│  │  ─────────────────────────────────────────────────────────────────  ││
│  │                                                                     ││
│  │  If you no longer want your courts listed on KudosCourts, you can   ││
│  │  request removal. This will:                                        ││
│  │  • Cancel all pending reservations                                  ││
│  │  • Remove your courts from public search                            ││
│  │  • Require admin approval to complete                               ││
│  │                                                                     ││
│  │  [Request Removal]                                                  ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Removal Request Modal (PRD Section 6.3)

```tsx
// src/features/owner/components/removal-request-modal.tsx

interface RemovalRequestModalProps {
  organizationId: string
  onSuccess: () => void
}

/* Layout:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Request Listing Removal                                            [×] │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │  ⚠️ This action will request removal of all your court listings.       │
 * │                                                                         │
 * │  Please tell us why you're leaving:                                     │
 * │  ┌───────────────────────────────────────────────────────────────────┐  │
 * │  │ (textarea for reason)                                             │  │
 * │  │                                                                   │  │
 * │  └───────────────────────────────────────────────────────────────────┘  │
 * │                                                                         │
 * │  ☐ I understand that pending reservations will be cancelled             │
 * │  ☐ I understand this requires admin approval                            │
 * │                                                                         │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                              [Cancel]  [Submit Request] │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * On submit:
 * - Court claim status → REMOVAL_REQUESTED
 * - Admin notified to review
 * - Owner sees pending removal status
 */
```

---

## 7. Claim Court Page

### Route: `/owner/claim/[courtId]`

### 7.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CLAIM COURT FLOW                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  Claim This Court                                                   ││
│  │                                                                     ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ [Court Image]                                                 │  ││
│  │  │                                                               │  ││
│  │  │ Court Name                                                    │  ││
│  │  │ 📍 Address, City                                              │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  You are claiming ownership of this court listing.                 ││
│  │  After verification, you'll be able to:                            ││
│  │                                                                     ││
│  │  ✓ Create bookable time slots                                      ││
│  │  ✓ Accept online reservations                                      ││
│  │  ✓ Manage payments and confirmations                               ││
│  │  ✓ Update court details and photos                                 ││
│  │                                                                     ││
│  │  Select Organization:                                               ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ My Pickleball Club                                     ▼      │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Notes for Reviewer (optional):                                     ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ I am the owner of this court and have been operating since... │  ││
│  │  │                                                               │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  ☑ I confirm that I am the authorized representative               ││
│  │    of this court facility                                          ││
│  │                                                                     ││
│  │  [Submit Claim Request]                                             ││
│  │                                                                     ││
│  │  ℹ️ Claims are typically reviewed within 24-48 hours               ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Implementation Checklist

### 8.1 Dashboard

- [ ] Stats cards with data
- [ ] Pending actions alert
- [ ] Recent activity feed
- [ ] Today's bookings timeline

### 8.2 Courts Management

- [ ] Courts table with actions
- [ ] Empty state
- [ ] Court form (tabbed)
- [ ] Photo upload and reorder
- [ ] Amenities selection
- [ ] Map location picker
- [ ] Payment settings

### 8.3 Slot Management

- [ ] Calendar navigation
- [ ] Date selection
- [ ] Slot list for date
- [ ] Slot status display
- [ ] Block/unblock actions
- [ ] Delete slot action
- [ ] Bulk slot creation modal
- [ ] Recurring slot options

### 8.4 Reservations

- [ ] Filters (court, status, date)
- [ ] Tabs (pending, upcoming, past)
- [ ] Reservations table
- [ ] Expandable row details
- [ ] Confirm action
- [ ] Reject with reason modal
- [ ] Player contact info
- [ ] Payment proof view

### 8.5 Settings

- [ ] Organization form
- [ ] Logo upload
- [ ] Slug validation
- [ ] Contact info
- [ ] Removal request button (PRD 6.3)
- [ ] Removal request modal
- [ ] Pending removal status display

### 8.6 Claim Court

- [ ] Court preview
- [ ] Organization selector
- [ ] Claim submission
- [ ] Success state

---

*End of UI Owner*
