# UI Developer 2 Checklist

**Focus Area:** Owner Dashboard + Admin Dashboard  
**Modules:** UI-3 (Owner) → UI-4 (Admin)

**Assumes:** Backend APIs are available or will be mocked  
**Depends on:** UI Dev 1 completing foundation (Day 1-2)

**Status:** COMPLETED

---

## Estimated Timeline: 6-7 days

| Day | Tasks | Status |
|-----|-------|--------|
| 1 | UI-3A: Owner Layout + Dashboard | DONE |
| 2 | UI-3B: Courts List + Court Form | DONE |
| 3 | UI-3C: Slot Management | DONE |
| 4 | UI-3D: Owner Reservations + Settings | DONE |
| 5 | UI-4A: Admin Layout + Dashboard | DONE |
| 6 | UI-4B: Claims Management | DONE |
| 7 | UI-4C: Admin Courts + Testing | DONE |

---

## Day 1: Owner Layout + Dashboard

### UI-3A: Owner Layout
**Reference:** `00-ui/04-ui-owner.md`

#### Route Group Setup
- [x] Create `src/app/(owner)/layout.tsx`
  - [x] Auth protection (redirect to sign-in)
  - [x] Organization check (redirect to create org if none)
  - [x] Wrap with DashboardLayout

#### Dashboard Layout Component
- [x] Create `src/shared/components/layout/dashboard-layout.tsx`
  - [x] Sidebar (w-64) + Main content (flex-1)
  - [x] Mobile: Sidebar as Sheet (drawer)
  - [x] Responsive breakpoint at lg (1024px)

#### Owner Sidebar
- [x] Create `src/features/owner/components/owner-sidebar.tsx`
  - [x] Navigation items:
    - [x] Dashboard (`/owner`)
    - [x] My Courts (`/owner/courts`)
    - [x] Reservations (`/owner/reservations`)
    - [x] Settings (`/owner/settings`)
  - [x] Active state styling
  - [x] Organization switcher (if user has multiple)
  - [x] Divider line

#### Owner Navbar
- [x] Create `src/features/owner/components/owner-navbar.tsx`
  - [x] Height: h-16
  - [x] Mobile menu button
  - [x] Organization name display
  - [x] User avatar dropdown

### UI-3B: Owner Dashboard Page
**Reference:** `00-ui/04-ui-owner.md`

#### Page Structure
- [x] Create `src/app/(owner)/owner/page.tsx`
- [x] Header: "Welcome back, {Name}"

#### Stats Cards
- [x] Create `src/features/owner/components/stats-card.tsx`
  - [x] Props: title, value, icon, trend, href
  - [x] Border: `rounded-xl shadow-sm`
  - [x] Icon with light bg
  - [x] Value: Outfit 700, text-2xl
  - [x] Optional trend indicator (up/down)
  - [x] Clickable with hover effect
- [x] Stats row:
  - [x] Active Courts
  - [x] Pending Bookings
  - [x] Today's Bookings
  - [x] Revenue (Month)

#### Pending Actions Alert
- [x] Create `src/features/owner/components/pending-actions.tsx`
  - [x] Warning background when count > 0
  - [x] "X bookings awaiting confirmation"
  - [x] "Review Now" CTA
  - [x] Hide when count is 0

#### Recent Activity Feed
- [x] Create `src/features/owner/components/recent-activity.tsx`
  - [x] List of recent events
  - [x] Event types: New booking, Payment confirmed, Slot blocked
  - [x] Relative timestamps

#### Today's Bookings Timeline
- [x] Create `src/features/owner/components/todays-bookings.tsx`
  - [x] Vertical timeline of today's slots
  - [x] Show booked slots with player name
  - [x] Time-based layout

#### Data Hook
- [x] Create `src/features/owner/hooks/use-owner-dashboard.ts`

---

## Day 2: Courts List + Court Form

### UI-3C: My Courts Page
**Reference:** `00-ui/04-ui-owner.md`

#### Page Structure
- [x] Create `src/app/(owner)/owner/courts/page.tsx`
- [x] Header: "My Courts" + "+ Add New Court" button

#### Courts Table
- [x] Table columns:
  - [x] Image (thumbnail)
  - [x] Name
  - [x] Location (city)
  - [x] Status (Active/Draft)
  - [x] Open Slots count
  - [x] Actions dropdown
- [x] Row hover state
- [x] Responsive: Cards on mobile

#### Action Dropdown
- [x] Create dropdown menu with:
  - [x] Edit Details → `/owner/courts/[id]/edit`
  - [x] Manage Slots → `/owner/courts/[id]/slots`
  - [x] View Bookings → `/owner/reservations?court=[id]`
  - [x] View Public Page → `/courts/[id]` (external)
  - [x] Separator
  - [x] Deactivate (destructive)

#### Empty State
- [x] Court icon
- [x] "No courts yet"
- [x] "Add your first court to start accepting bookings"
- [x] "+ Add Your First Court" button
- [x] "— or —"
- [x] "Claim an Existing Court" link

#### Data Hook
- [x] Create `src/features/owner/hooks/use-owner-courts.ts`

### UI-3D: Court Form (Create/Edit)
**Reference:** `00-ui/04-ui-owner.md`

#### Page Structure
- [x] Create `src/app/(owner)/owner/courts/new/page.tsx`
- [x] Create `src/app/(owner)/owner/courts/[id]/edit/page.tsx`
- [x] Header: "Create New Court" / "Edit Court"

#### Tabbed Form
- [x] Create `src/features/owner/components/court-form.tsx`
- [x] Tabs: Basic Info, Location, Photos, Amenities, Payment

#### Basic Info Tab
- [x] Court Name (required)
- [x] Number of Courts (default 1)
- [x] Operating Hours (start/end time pickers)

#### Location Tab
- [x] Address (required)
- [x] City dropdown (required)
- [x] Map location picker
  - [x] Interactive map
  - [x] Click to set pin
  - [x] Display lat/lng

#### Photos Tab
- [x] Photo upload grid (max 10)
- [x] Drag to reorder
- [x] Delete button on each
- [x] "First photo will be the cover image" note

#### Amenities Tab
- [x] Checkbox grid:
  - [x] Parking, Restrooms, Lights, Showers
  - [x] Locker Rooms, Equipment Rental, Pro Shop
  - [x] Seating Area, Food/Drinks
- [x] Custom amenities input with Add button

#### Payment Tab
- [x] Radio: Free Court / Paid Court
- [x] If Paid:
  - [x] Default Hourly Rate (currency + amount)
  - [x] Payment Instructions textarea
  - [x] GCash checkbox + number input
  - [x] Bank Transfer checkbox + bank/account/name inputs

#### Form Actions
- [x] Cancel button
- [x] Save as Draft button
- [x] Publish Court button (primary)

#### Schema
- [x] Create `src/features/owner/schemas/court-form.schema.ts`

#### Hook
- [x] Create `src/features/owner/hooks/use-court-form.ts`

---

## Day 3: Slot Management

### UI-3E: Manage Slots Page
**Reference:** `00-ui/04-ui-owner.md`

#### Page Structure
- [x] Create `src/app/(owner)/owner/courts/[id]/slots/page.tsx`
- [x] Header: "Manage Time Slots - {Court Name}" + "+ Add Slots" button

#### Calendar Navigation
- [x] Create `src/features/owner/components/calendar-navigation.tsx`
  - [x] Month/year display with prev/next arrows
  - [x] Mini calendar grid
  - [x] Today button
  - [x] View toggle: Day/Week/Month
  - [x] Selected date highlighted
  - [x] Dates with slots have indicator dot

#### Slot List for Selected Date
- [x] Create `src/features/owner/components/slot-list.tsx`
- [x] Header: "Slots for {Date}"
- [x] Time-based list

#### Slot Item
- [x] Create `src/features/owner/components/slot-item.tsx`
- [x] Display:
  - [x] Time range (6:00 AM - 7:00 AM)
  - [x] Duration
  - [x] Status indicator:
    - [x] Available (green dot) - price shown
    - [x] Booked (blue dot) - player name, phone
    - [x] Pending (yellow dot) - player name, "Payment marked"
    - [x] Blocked (gray dot)
  - [x] Actions based on status:
    - [x] Available: Block, Delete
    - [x] Booked: View booking
    - [x] Pending: Confirm, Reject
    - [x] Blocked: Unblock

#### No Slot Placeholder
- [x] For time gaps: "No slot created" + "+ Add Slot" button

#### Bulk Slot Creation Modal
- [x] Create `src/features/owner/components/bulk-slot-modal.tsx`
- [x] Radio: Single Day / Multiple Days (recurring)
- [x] Date range picker (if recurring)
- [x] Days of week checkboxes (if recurring)
- [x] Start time / End time
- [x] Duration dropdown (30min, 1hr, 1.5hr, 2hr)
- [x] Pricing:
  - [x] Use default price checkbox
  - [x] Custom price input
- [x] Preview: "This will create X slots per day, Total: Y slots"
- [x] Cancel / Create Slots buttons

#### Data Hook
- [x] Create `src/features/owner/hooks/use-slots.ts`

---

## Day 4: Owner Reservations + Settings

### UI-3F: Owner Reservations Page
**Reference:** `00-ui/04-ui-owner.md`

#### Page Structure
- [x] Create `src/app/(owner)/owner/reservations/page.tsx`
- [x] Header: "Reservations"

#### Filters Row
- [x] Court dropdown (All Courts)
- [x] Status dropdown (All Status)
- [x] Date range picker
- [x] Search input (player name/email)

#### Tabs
- [x] Pending Action (with count badge)
- [x] Upcoming
- [x] Past
- [x] Cancelled

#### Reservations Table
- [x] Columns:
  - [x] Court name
  - [x] Player name + phone
  - [x] Date/Time
  - [x] Amount
  - [x] Status badge
  - [x] Action buttons
- [x] Expandable rows

#### Expanded Row Details
- [x] Player Details section:
  - [x] Name, Email, Phone
- [x] Payment Proof section:
  - [x] Reference number
  - [x] "View Receipt Image" link
- [x] Notes
- [x] Confirm / Reject buttons

#### Confirm Action
- [x] Create `src/features/owner/components/confirm-dialog.tsx`
- [x] Simple confirmation dialog
- [x] Success toast on confirm

#### Reject Action
- [x] Create `src/features/owner/components/reject-modal.tsx`
- [x] Requires reason textarea
- [x] Cancel / Reject buttons

#### Data Hook
- [x] Create `src/features/owner/hooks/use-owner-reservations.ts`

### UI-3G: Organization Settings Page
**Reference:** `00-ui/04-ui-owner.md`

#### Page Structure
- [x] Create `src/app/(owner)/owner/settings/page.tsx`
- [x] Header: "Organization Settings"

#### Organization Form
- [x] Logo upload with preview
- [x] Organization Name (required)
- [x] URL Slug with prefix display (`kudoscourts.com/org/`)
- [x] Description textarea
- [x] Contact Information:
  - [x] Email
  - [x] Phone
  - [x] Address

#### Save Button
- [x] "Save Changes" with loading state

#### Danger Zone (PRD Section 6.3)
- [x] Red bordered section
- [x] "Request Listing Removal" header
- [x] Explanation text:
  - [x] "This will cancel all pending reservations"
  - [x] "Remove your courts from public search"
  - [x] "Require admin approval"
- [x] "Request Removal" button (destructive)

#### Removal Request Modal (PRD Section 6.3)
- [x] Create `src/features/owner/components/removal-request-modal.tsx`
- [x] Warning header
- [x] Reason textarea: "Please tell us why you're leaving"
- [x] Checkboxes:
  - [x] "I understand pending reservations will be cancelled"
  - [x] "I understand this requires admin approval"
- [x] Cancel / Submit Request buttons

#### Claim Court Page
- [x] Create `src/app/(owner)/owner/claim/[courtId]/page.tsx`
- [x] Court preview (image, name, address)
- [x] Benefits list
- [x] Organization selector
- [x] Notes textarea
- [x] Confirmation checkbox
- [x] Submit Claim button
- [x] "Claims typically reviewed within 24-48 hours" note

#### Schema
- [x] Create `src/features/owner/schemas/organization.schema.ts`

#### Hooks
- [x] Create `src/features/owner/hooks/use-organization.ts`
- [x] Create `src/features/owner/hooks/use-claim-court.ts`

---

## Day 5: Admin Layout + Dashboard

### UI-4A: Admin Layout
**Reference:** `00-ui/05-ui-admin.md`

#### Route Group Setup
- [x] Create `src/app/(admin)/layout.tsx`
  - [x] Auth protection
  - [x] Admin role check
  - [x] Redirect non-admins with error

#### Admin Sidebar
- [x] Create `src/features/admin/components/admin-sidebar.tsx`
  - [x] Navigation items:
    - [x] Dashboard (`/admin`)
    - [x] Claims (`/admin/claims`) with pending count badge
    - [x] Courts (`/admin/courts`)
  - [x] "Admin Panel" label
  - [x] Active state styling

#### Admin-Only Wrapper
- [x] Create `src/features/admin/components/admin-only.tsx`
  - [x] For conditional rendering based on admin role

### UI-4B: Admin Dashboard Page
**Reference:** `00-ui/05-ui-admin.md`

#### Page Structure
- [x] Create `src/app/(admin)/admin/page.tsx`
- [x] Header: "Admin Dashboard"

#### Stats Overview
- [x] Stats cards row:
  - [x] Pending Claims
  - [x] Total Courts
  - [x] Reservable Courts
  - [x] Active Organizations

#### Pending Claims Preview
- [x] Warning-style card if count > 0
- [x] "X claims awaiting review"
- [x] Mini table with recent claims:
  - [x] Court Name, Organization, Time ago
- [x] "View All Claims →" link

#### Recent Activity
- [x] Activity feed:
  - [x] Claim approved
  - [x] New curated court added
  - [x] Claim rejected
  - [x] Court deactivated

#### Data Hook
- [x] Create `src/features/admin/hooks/use-admin-dashboard.ts`

---

## Day 6: Claims Management

### UI-4C: Pending Claims Page
**Reference:** `00-ui/05-ui-admin.md`

#### Page Structure
- [x] Create `src/app/(admin)/admin/claims/page.tsx`
- [x] Header: "Claim Requests"

#### Filters
- [x] Type dropdown (All Types, CLAIM, REMOVAL)
- [x] Status dropdown (All Status)
- [x] Search input

#### Tabs
- [x] Pending (with count)
- [x] Approved
- [x] Rejected

#### Claims Table
- [x] Columns:
  - [x] Type badge (CLAIM/REMOVAL)
  - [x] Court name + location
  - [x] Organization name + owner
  - [x] Submitted (relative time)
  - [x] Review button
- [x] Type badges:
  - [x] CLAIM: default badge with Tag icon
  - [x] REMOVAL: destructive badge with Trash icon

#### Pagination
- [x] Page numbers
- [x] "Showing X-Y of Z" text

#### Data Hook
- [x] Create `src/features/admin/hooks/use-claims.ts`

### UI-4D: Claim Detail Page
**Reference:** `00-ui/05-ui-admin.md`

#### Page Structure
- [x] Create `src/app/(admin)/admin/claims/[id]/page.tsx`
- [x] Breadcrumbs: Admin > Claims > Claim #{id}

#### Status Banner
- [x] PENDING: amber, "Submitted X ago by {Name}"
- [x] APPROVED: green
- [x] REJECTED: gray

#### Two-Column Layout

#### Left Column - Claim Details

##### Court Information Card
- [x] Court photo
- [x] Court name
- [x] Address
- [x] Current status (Curated/Unclaimed)
- [x] Listed date
- [x] "View Court Details →" link

##### Claiming Organization Card
- [x] Logo
- [x] Organization name
- [x] Owner name
- [x] Email, phone
- [x] Registration date
- [x] Courts owned count
- [x] "View Organization →" link

##### Request Notes
- [x] Display submitted notes

##### Timeline
- [x] Use KudosTimeline component
- [x] Show claim events

#### Right Column - Review Actions

##### Decision Form
- [x] Create `src/features/admin/components/claim-review-actions.tsx`
- [x] Radio options:
  - [x] Approve Claim
  - [x] Reject Claim
- [x] Review Notes textarea
- [x] If reject: reason required
- [x] Submit Decision button

##### For Removal Requests (PRD 6.3)
- [x] Show different explanation text
- [x] Approve = Deactivate court or return to curated
- [x] Reject = Keep court active

#### Confirmation Dialogs

##### Approve Dialog
- [x] Explain what happens:
  - [x] Court type → RESERVABLE
  - [x] Organization gains ownership
  - [x] Curated details converted

##### Reject Dialog
- [x] Explain what happens:
  - [x] Claim status → REJECTED
  - [x] Court remains CURATED
  - [x] Requester notified

---

## Day 7: Admin Courts + Testing

### UI-4E: All Courts Page
**Reference:** `00-ui/05-ui-admin.md`

#### Page Structure
- [x] Create `src/app/(admin)/admin/courts/page.tsx`
- [x] Header: "All Courts" + "+ Add Curated Court" button

#### Filters
- [x] Type dropdown (All, Curated, Reservable)
- [x] Status dropdown (All, Active, Inactive)
- [x] City dropdown
- [x] Claim Status dropdown (Unclaimed, Claim Pending, Claimed, Removal Requested)
- [x] Search input

#### Courts Table
- [x] Columns:
  - [x] Image
  - [x] Name + location
  - [x] Type (CURATED/RESERVABLE badge)
  - [x] Owner (org name or "-")
  - [x] Status (Active/Inactive dot)
  - [x] Actions dropdown
- [x] Action menu:
  - [x] View Details (external)
  - [x] Edit Court
  - [x] Separator
  - [x] Activate/Deactivate
  - [x] Separator
  - [x] View History

### UI-4F: Create Curated Court Page
**Reference:** `00-ui/05-ui-admin.md`

#### Page Structure
- [x] Create `src/app/(admin)/admin/courts/new/page.tsx`
- [x] Header: "Add Curated Court"

#### Curated Court Form
- [x] Basic Information section:
  - [x] Court Name (required)
  - [x] Address (required)
  - [x] City dropdown (required)
  - [x] Map location picker

- [x] Contact Information section:
  - [x] Facebook Page URL
  - [x] Instagram URL
  - [x] Viber Contact
  - [x] Website URL
  - [x] Other Contact Info textarea

- [x] Photos & Amenities section:
  - [x] Photo upload grid
  - [x] Amenities checkbox grid

#### Form Actions
- [x] Cancel
- [x] Create Court

#### Schema
- [x] Create `src/features/admin/schemas/curated-court.schema.ts`

### UI-4G: Admin Court Edit Page
**Reference:** `00-ui/05-ui-admin.md`

#### Page Structure
- [x] Create `src/app/(admin)/admin/courts/[id]/page.tsx`

#### Same form as create, plus:
- [x] Pre-populated data
- [x] Court type display (read-only)
- [x] Claim status display
- [x] Ownership info (if claimed)
- [x] Admin actions section:
  - [x] Activate/Deactivate toggle
  - [x] View audit history button

#### Data Hook
- [x] Create `src/features/admin/hooks/use-admin-courts.ts`

---

## Testing Checklist

### Owner Dashboard
- [x] Stats load correctly
- [x] Pending actions alert shows/hides
- [x] Recent activity displays
- [x] Navigation works

### Owner Courts
- [x] Courts table displays
- [x] Actions work (edit, slots, deactivate)
- [x] Court form validates
- [x] Photo upload/reorder works
- [x] Map picker works

### Owner Slots
- [x] Calendar navigation works
- [x] Slots display by date
- [x] Bulk creation works
- [x] Block/unblock works
- [x] Confirm/reject pending works

### Owner Reservations
- [x] Filters work
- [x] Tabs filter correctly
- [x] Expandable rows work
- [x] Confirm/reject with reason works

### Owner Settings
- [x] Form saves correctly
- [x] Slug validation works
- [x] Removal request flow works (PRD 6.3)

### Admin Dashboard
- [x] Stats load correctly
- [x] Pending claims preview works
- [x] Activity feed displays

### Admin Claims
- [x] Filters and tabs work
- [x] Claim detail loads
- [x] Approve flow works
- [x] Reject flow requires reason
- [x] Removal requests handled (PRD 6.3)

### Admin Courts
- [x] All filters work
- [x] Curated court creation works
- [x] Edit works
- [x] Activate/deactivate works

### Responsiveness
- [x] Owner sidebar collapses on mobile
- [x] Admin sidebar collapses on mobile
- [x] Tables become cards on mobile
- [x] Forms stack properly

### Accessibility
- [x] Keyboard navigation in tables
- [x] Focus management in modals
- [x] Screen reader labels
- [x] Color contrast passes

---

## Files Created

```
src/shared/components/layout/
├── dashboard-layout.tsx

src/features/owner/
├── components/
│   ├── owner-sidebar.tsx
│   ├── owner-navbar.tsx
│   ├── stats-card.tsx
│   ├── pending-actions.tsx
│   ├── recent-activity.tsx
│   ├── todays-bookings.tsx
│   ├── court-form.tsx
│   ├── calendar-navigation.tsx
│   ├── slot-list.tsx
│   ├── slot-item.tsx
│   ├── bulk-slot-modal.tsx
│   ├── confirm-dialog.tsx
│   ├── reject-modal.tsx
│   └── removal-request-modal.tsx
├── hooks/
│   ├── use-owner-dashboard.ts
│   ├── use-owner-courts.ts
│   ├── use-court-form.ts
│   ├── use-slots.ts
│   ├── use-owner-reservations.ts
│   ├── use-organization.ts
│   └── use-claim-court.ts
└── schemas/
    ├── court-form.schema.ts
    └── organization.schema.ts

src/features/admin/
├── components/
│   ├── admin-sidebar.tsx
│   ├── admin-only.tsx
│   └── claim-review-actions.tsx
├── hooks/
│   ├── use-admin-dashboard.ts
│   ├── use-claims.ts
│   └── use-admin-courts.ts
└── schemas/
    └── curated-court.schema.ts

src/app/
├── (owner)/
│   └── owner/
│       ├── page.tsx
│       ├── courts/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/
│       │       ├── edit/page.tsx
│       │       └── slots/page.tsx
│       ├── reservations/page.tsx
│       ├── settings/page.tsx
│       └── claim/[courtId]/page.tsx
└── (admin)/
    └── admin/
        ├── page.tsx
        ├── claims/
        │   ├── page.tsx
        │   └── [id]/page.tsx
        └── courts/
            ├── page.tsx
            ├── new/page.tsx
            └── [id]/page.tsx
```

---

## PRD Requirements Covered

- [x] PRD 6.3: Removal Request Flow (Owner Settings + Admin Claims)
- [x] PRD 9: Time Slot Management (Owner Slots)
- [x] PRD 12: Organization Management (Owner Settings)
- [x] PRD 6: Court Claiming Flow (Claim Court Page + Admin Claims)
