# UI Developer 4 Checklist

**Focus Area:** Owner Dashboard + Admin Dashboard  
**Modules:** Owner (UI-3) → Admin (UI-4)

---

## Phase UI-3A: Owner Dashboard - Layout & Navigation

**Reference:** `04-ui-owner.md`  
**Estimated Time:** 1.5 days  
**Dependencies:** UI-0B (Layout Components) complete  
**Can parallelize with:** UI Dev 1-3 work

### Owner Layout
**File:** `src/app/(owner)/owner/layout.tsx`
- [ ] Auth-protected route
- [ ] Organization ownership check
- [ ] DashboardLayout integration
- [ ] Sidebar navigation

### Owner Sidebar
**File:** `src/features/owner/components/owner-sidebar.tsx`
- [ ] Navigation items:
  - [ ] Dashboard
  - [ ] My Courts
  - [ ] Reservations (with badge count)
  - [ ] Settings
- [ ] Organization switcher (if multiple orgs)
- [ ] Active state styling
- [ ] Mobile: Sheet drawer

### Owner Navbar
**File:** `src/features/owner/components/owner-navbar.tsx`
- [ ] Logo
- [ ] Mobile menu trigger
- [ ] User menu dropdown
- [ ] Notifications (future)

### Organization Switcher
**File:** `src/features/owner/components/org-switcher.tsx`
- [ ] Current org display
- [ ] Dropdown with all orgs
- [ ] Create new org link
- [ ] Selection handler

### Organization Context
**File:** `src/features/owner/contexts/organization-context.tsx`
- [ ] Current organization state
- [ ] Organization list
- [ ] Switch organization function
- [ ] Provider component

### Testing
- [ ] Layout renders correctly
- [ ] Sidebar navigation works
- [ ] Organization switcher works
- [ ] Mobile sidebar works
- [ ] Auth redirect works

---

## Phase UI-3B: Owner Dashboard - Home

**Reference:** `04-ui-owner.md`  
**Estimated Time:** 1.5 days  
**Dependencies:** UI-3A complete

### Dashboard Page
**File:** `src/app/(owner)/owner/page.tsx`
- [ ] Welcome message
- [ ] Stats cards
- [ ] Pending actions alert
- [ ] Recent activity
- [ ] Today's bookings

### Stats Card Component
**File:** `src/features/owner/components/stats-card.tsx`
- [ ] Icon
- [ ] Title
- [ ] Value (large number)
- [ ] Optional trend indicator
- [ ] Optional link
- [ ] Hover state

### Dashboard Stats Grid
- [ ] Active Courts
- [ ] Pending Bookings (link to reservations)
- [ ] Today's Bookings
- [ ] Revenue (this month)

### Pending Actions Alert
**File:** `src/features/owner/components/pending-actions.tsx`
- [ ] Warning background
- [ ] Count of pending items
- [ ] Review Now CTA
- [ ] Hide if count is 0

### Recent Activity Feed
**File:** `src/features/owner/components/activity-feed.tsx`
- [ ] List of recent events
- [ ] Event icon by type
- [ ] Relative timestamp
- [ ] Link to relevant page

### Today's Timeline
**File:** `src/features/owner/components/today-timeline.tsx`
- [ ] Timeline of today's bookings
- [ ] Time on left
- [ ] Booking info on right
- [ ] Status indicators

### Data Fetching
**File:** `src/features/owner/hooks/use-owner-dashboard.ts`
- [ ] Stats data
- [ ] Recent activity
- [ ] Today's bookings
- [ ] Pending count

### Testing
- [ ] Stats load correctly
- [ ] Pending alert shows/hides
- [ ] Activity feed loads
- [ ] Timeline displays correctly

---

## Phase UI-3C: Owner Dashboard - Courts Management

**Reference:** `04-ui-owner.md`  
**Estimated Time:** 2.5 days  
**Dependencies:** UI-3B complete, Backend Phase 2A ready

### My Courts Page
**File:** `src/app/(owner)/owner/courts/page.tsx`
- [ ] Page header with Add New Court button
- [ ] Courts table
- [ ] Empty state

### Courts Table
**File:** `src/features/owner/components/courts-table.tsx`
- [ ] Columns: Image, Name, Location, Status, Slots, Actions
- [ ] Action dropdown menu:
  - [ ] Edit Details
  - [ ] Manage Slots
  - [ ] View Bookings
  - [ ] View Public Page (external)
  - [ ] Deactivate
- [ ] Row click → Edit

### Create Court Page
**File:** `src/app/(owner)/owner/courts/new/page.tsx`
- [ ] Tabbed form
- [ ] Step indicator (optional)
- [ ] Save as Draft / Publish buttons

### Court Form Component
**File:** `src/features/owner/components/court-form.tsx`
- [ ] Tabs: Basic Info, Location, Photos, Amenities, Payment
- [ ] Form validation with Zod
- [ ] react-hook-form integration

### Court Form - Basic Info Tab
- [ ] Court name input
- [ ] Number of courts
- [ ] Operating hours (start/end time)

### Court Form - Location Tab
- [ ] Address input
- [ ] City selector
- [ ] Map with pin picker
- [ ] Lat/lng display

### Court Form - Photos Tab
- [ ] Photo grid
- [ ] Add photo button
- [ ] Drag to reorder
- [ ] Delete photo
- [ ] First = cover image note

### Court Form - Amenities Tab
- [ ] Preset amenities checkboxes
- [ ] Custom amenity input
- [ ] Add custom amenity

### Court Form - Payment Tab
- [ ] Free/Paid radio
- [ ] Default hourly rate (if paid)
- [ ] Currency selector
- [ ] Payment instructions textarea
- [ ] GCash number input
- [ ] Bank details inputs

### Map Location Picker
**File:** `src/features/owner/components/map-picker.tsx`
- [ ] Interactive map (Mapbox or Google Maps)
- [ ] Click to place pin
- [ ] Drag to adjust
- [ ] Search address
- [ ] Output lat/lng

### Edit Court Page
**File:** `src/app/(owner)/owner/courts/[id]/edit/page.tsx`
- [ ] Same form as create
- [ ] Pre-populated data
- [ ] Save Changes button

### Data Hooks
**File:** `src/features/owner/hooks/use-owner-courts.ts`
- [ ] `useOwnerCourts(orgId)` - list courts
- [ ] `useOwnerCourt(courtId)` - single court
- [ ] `useCreateCourt()` - mutation
- [ ] `useUpdateCourt()` - mutation
- [ ] `useDeactivateCourt()` - mutation

### Testing
- [ ] Courts table loads
- [ ] Create court flow works
- [ ] Edit court flow works
- [ ] Photo management works
- [ ] Map picker works
- [ ] Validation works

---

## Phase UI-3D: Owner Dashboard - Slot Management

**Reference:** `04-ui-owner.md`  
**Estimated Time:** 2 days  
**Dependencies:** UI-3C complete, Backend Phase 2B ready

### Manage Slots Page
**File:** `src/app/(owner)/owner/courts/[id]/slots/page.tsx`
- [ ] Court name in header
- [ ] Calendar navigation
- [ ] Date picker
- [ ] Slots list for selected date

### Calendar Navigation
**File:** `src/features/owner/components/calendar-nav.tsx`
- [ ] Month/year display
- [ ] Previous/next arrows
- [ ] Today button
- [ ] View switcher (Day/Week/Month) - future

### Date Grid
**File:** `src/features/owner/components/date-grid.tsx`
- [ ] Monthly calendar view
- [ ] Day cells with booking indicators
- [ ] Click to select date
- [ ] Today highlight

### Slots List for Date
**File:** `src/features/owner/components/slots-list.tsx`
- [ ] List of slots for selected date
- [ ] Time and duration
- [ ] Status indicator
- [ ] Price
- [ ] Player info (if booked/held)
- [ ] Actions per slot

### Slot Item Component
**File:** `src/features/owner/components/slot-item.tsx`
- [ ] Available: Block, Delete actions
- [ ] Booked: Player info, View action
- [ ] Held: Player info, TTL countdown, Confirm action
- [ ] Blocked: Unblock action

### Add Slots Modal
**File:** `src/features/owner/components/add-slots-modal.tsx`
- [ ] Single day / Multiple days toggle
- [ ] Date range picker
- [ ] Days of week checkboxes
- [ ] Start time / End time
- [ ] Duration selector
- [ ] Pricing options (default or custom)
- [ ] Preview summary
- [ ] Create button

### Data Hooks
**File:** `src/features/owner/hooks/use-owner-slots.ts`
- [ ] `useOwnerSlots(courtId, date)` - list slots
- [ ] `useCreateSlot()` - single slot mutation
- [ ] `useCreateBulkSlots()` - bulk mutation
- [ ] `useBlockSlot()` / `useUnblockSlot()` - mutations
- [ ] `useDeleteSlot()` - mutation

### Testing
- [ ] Calendar navigation works
- [ ] Slots load for date
- [ ] Add single slot works
- [ ] Add bulk slots works
- [ ] Block/unblock works
- [ ] Delete works
- [ ] Overlap prevention works

---

## Phase UI-3E: Owner Dashboard - Reservations

**Reference:** `04-ui-owner.md`  
**Estimated Time:** 2 days  
**Dependencies:** UI-3D complete, Backend Phase 3B ready

### Owner Reservations Page
**File:** `src/app/(owner)/owner/reservations/page.tsx`
- [ ] Page header
- [ ] Filters bar
- [ ] Tabs (Pending Action, Upcoming, Past, Cancelled)
- [ ] Reservations table

### Reservations Filters
**File:** `src/features/owner/components/reservations-filters.tsx`
- [ ] Court selector
- [ ] Status filter
- [ ] Date range
- [ ] Player search

### Reservations Table
**File:** `src/features/owner/components/reservations-table.tsx`
- [ ] Columns: Court, Player, Date/Time, Amount, Status, Actions
- [ ] Expandable row for details
- [ ] Inline actions (Confirm/Reject)

### Reservation Row Expanded
**File:** `src/features/owner/components/reservation-expanded.tsx`
- [ ] Player details (name, email, phone)
- [ ] Payment proof (if exists):
  - [ ] Reference number
  - [ ] View receipt image
  - [ ] Notes
- [ ] Confirm Payment button
- [ ] Reject with Reason button

### Confirm Payment Action
**File:** `src/features/owner/components/confirm-payment-action.tsx`
- [ ] Confirmation dialog
- [ ] Optional notes input
- [ ] Confirm button with loading

### Reject Reservation Dialog
**File:** `src/features/owner/components/reject-dialog.tsx`
- [ ] Reason textarea (required)
- [ ] Cancel and Reject buttons
- [ ] Loading state

### Data Hooks
**File:** `src/features/owner/hooks/use-owner-reservations.ts`
- [ ] `useOwnerReservations(orgId, filters)` - list
- [ ] `usePendingReservations(courtId)` - pending for court
- [ ] `useConfirmPayment()` - mutation
- [ ] `useRejectReservation()` - mutation

### Testing
- [ ] Reservations table loads
- [ ] Filters work
- [ ] Confirm payment works
- [ ] Reject with reason works
- [ ] Status updates correctly

---

## Phase UI-3F: Owner Dashboard - Settings & Claims

**Reference:** `04-ui-owner.md`  
**Estimated Time:** 1.5 days  
**Dependencies:** UI-3B complete

### Organization Settings Page
**File:** `src/app/(owner)/owner/settings/page.tsx`
- [ ] Page header
- [ ] Organization form

### Organization Form
**File:** `src/features/owner/components/organization-form.tsx`
- [ ] Logo upload
- [ ] Organization name
- [ ] URL slug (with preview)
- [ ] Description textarea
- [ ] Contact info (email, phone, address)
- [ ] Save button

### Claim Court Page
**File:** `src/app/(owner)/owner/claim/[courtId]/page.tsx`
- [ ] Court preview card
- [ ] Benefits list
- [ ] Organization selector
- [ ] Notes textarea
- [ ] Confirmation checkbox
- [ ] Submit button

### Data Hooks
**File:** `src/features/owner/hooks/use-owner-settings.ts`
- [ ] `useUpdateOrganization()` - mutation
- [ ] `useUpdateOrganizationProfile()` - mutation
- [ ] `useSubmitClaimRequest()` - mutation

### Testing
- [ ] Settings form works
- [ ] Logo upload works
- [ ] Claim submission works

---

## Phase UI-4A: Admin Dashboard - Layout

**Reference:** `05-ui-admin.md`  
**Estimated Time:** 1 day  
**Dependencies:** Backend Phase 4B ready (admin role)  
**Can parallelize with:** UI-3 work

### Admin Layout
**File:** `src/app/(admin)/admin/layout.tsx`
- [ ] Admin role check
- [ ] Redirect non-admins
- [ ] DashboardLayout integration

### Admin Sidebar
**File:** `src/features/admin/components/admin-sidebar.tsx`
- [ ] Navigation items:
  - [ ] Dashboard
  - [ ] Claims (with pending badge)
  - [ ] Courts
- [ ] Active state styling

### Admin Dashboard Page
**File:** `src/app/(admin)/admin/page.tsx`
- [ ] Stats overview
- [ ] Pending claims preview
- [ ] Recent activity

### Testing
- [ ] Admin access works
- [ ] Non-admin redirected
- [ ] Navigation works

---

## Phase UI-4B: Admin Dashboard - Claims

**Reference:** `05-ui-admin.md`  
**Estimated Time:** 2.5 days  
**Dependencies:** UI-4A complete

### Claims List Page
**File:** `src/app/(admin)/admin/claims/page.tsx`
- [ ] Page header
- [ ] Filters
- [ ] Tabs (Pending, Approved, Rejected)
- [ ] Claims table

### Claims Table
**File:** `src/features/admin/components/claims-table.tsx`
- [ ] Columns: Type, Court, Organization, Submitted, Actions
- [ ] Type badges (CLAIM / REMOVAL)
- [ ] Status badges
- [ ] Review button

### Claim Detail Page
**File:** `src/app/(admin)/admin/claims/[id]/page.tsx`
- [ ] Status banner
- [ ] Court information card
- [ ] Organization information card
- [ ] Request notes
- [ ] Timeline
- [ ] Review actions (sidebar)

### Court Info Card (Admin)
**File:** `src/features/admin/components/claim-court-card.tsx`
- [ ] Court photo
- [ ] Court name and location
- [ ] Current status
- [ ] Listed date
- [ ] View Details link

### Organization Info Card (Admin)
**File:** `src/features/admin/components/claim-org-card.tsx`
- [ ] Logo
- [ ] Organization name
- [ ] Owner info
- [ ] Contact info
- [ ] Registration date
- [ ] Courts owned count

### Review Actions Component
**File:** `src/features/admin/components/claim-review-actions.tsx`
- [ ] Radio: Approve / Reject
- [ ] Review notes textarea
- [ ] Submit Decision button
- [ ] Reason required for rejection

### Approve Confirmation Dialog
**File:** `src/features/admin/components/approve-claim-dialog.tsx`
- [ ] Explanation of what happens
- [ ] Notes input
- [ ] Confirm button

### Reject Confirmation Dialog
**File:** `src/features/admin/components/reject-claim-dialog.tsx`
- [ ] Reason input (required)
- [ ] Explanation
- [ ] Reject button

### Data Hooks
**File:** `src/features/admin/hooks/use-admin-claims.ts`
- [ ] `usePendingClaims(pagination)` - list
- [ ] `useClaimById(id)` - single claim
- [ ] `useApproveClaim()` - mutation
- [ ] `useRejectClaim()` - mutation

### Testing
- [ ] Claims list loads
- [ ] Filters work
- [ ] Claim detail loads
- [ ] Approve flow works
- [ ] Reject flow works

---

## Phase UI-4C: Admin Dashboard - Courts

**Reference:** `05-ui-admin.md`  
**Estimated Time:** 2 days  
**Dependencies:** UI-4B complete

### Admin Courts Page
**File:** `src/app/(admin)/admin/courts/page.tsx`
- [ ] Page header with Add Curated Court button
- [ ] Filters (type, status, city, claim status)
- [ ] Courts table

### Admin Courts Table
**File:** `src/features/admin/components/admin-courts-table.tsx`
- [ ] Columns: Image, Name, Type, Owner, Status, Actions
- [ ] Type indicators (CURATED / RESERVABLE)
- [ ] Claim status indicators
- [ ] Action menu

### Create Curated Court Page
**File:** `src/app/(admin)/admin/courts/new/page.tsx`
- [ ] Curated court form
- [ ] Contact info fields
- [ ] Photos and amenities
- [ ] Create button

### Admin Court Edit Page
**File:** `src/app/(admin)/admin/courts/[id]/page.tsx`
- [ ] Same form as create
- [ ] Pre-populated data
- [ ] Additional admin actions
- [ ] Deactivate/Activate buttons

### Deactivate Dialog
**File:** `src/features/admin/components/deactivate-court-dialog.tsx`
- [ ] Reason input (required)
- [ ] Explanation of effects
- [ ] Deactivate button

### Data Hooks
**File:** `src/features/admin/hooks/use-admin-courts.ts`
- [ ] `useAdminCourts(filters)` - list all courts
- [ ] `useCreateCuratedCourt()` - mutation
- [ ] `useAdminUpdateCourt()` - mutation
- [ ] `useActivateCourt()` / `useDeactivateCourt()` - mutations

### Testing
- [ ] Courts list loads
- [ ] Filters work
- [ ] Create curated court works
- [ ] Edit court works
- [ ] Activate/deactivate works

---

## Final Checklist (UI Dev 4)

- [ ] Owner dashboard complete
- [ ] Admin dashboard complete
- [ ] All forms work correctly
- [ ] All tables load and filter
- [ ] All mutations work
- [ ] Proper authorization in place
- [ ] No TypeScript errors
- [ ] Responsive at all breakpoints
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Accessibility checked

---

## Parallelization Notes

| Task | Can Start After | Can Run With |
|------|-----------------|--------------|
| UI-3A Owner Layout | UI-0B Layout | UI Dev 1-3 work |
| UI-3B Owner Dashboard | UI-3A | UI Dev 1-3 work |
| UI-3C Courts Management | UI-3B, Backend 2A | UI Dev 2 Booking |
| UI-3D Slot Management | UI-3C, Backend 2B | UI Dev 3 Reservations |
| UI-3E Owner Reservations | UI-3D, Backend 3B | UI Dev 3 Profile |
| UI-3F Settings & Claims | UI-3B | UI Dev 1-3 work |
| UI-4A Admin Layout | Backend 4B | UI-3 work |
| UI-4B Admin Claims | UI-4A | UI-3E |
| UI-4C Admin Courts | UI-4B | Independent |
