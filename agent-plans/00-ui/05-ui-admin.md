# UI Admin - Admin Dashboard

**Phase:** UI-4  
**Backend Dependency:** Phase 4B (Claim Admin), Phase 5A (Admin Court)  
**Priority:** Medium - Platform administration

---

## Overview

The admin dashboard provides platform administrators with tools to review claim requests, moderate courts, and manage curated listings. Access is restricted to users with admin roles.

### Pages in This Module

| Page | Route | Description |
|------|-------|-------------|
| Admin Dashboard | `/admin` | Overview with pending claims |
| Pending Claims | `/admin/claims` | Claim request queue |
| Claim Detail | `/admin/claims/[id]` | Review single claim |
| All Courts | `/admin/courts` | Court moderation |
| Create Curated Court | `/admin/courts/new` | Add new curated listing |
| Edit Court (Admin) | `/admin/courts/[id]` | Admin court editing |

---

## 1. Admin Dashboard

### Route: `/admin`

### 1.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ADMIN NAVBAR                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SIDEBAR              │  MAIN CONTENT                                   │
│  ┌─────────────────┐  │  ┌───────────────────────────────────────────┐  │
│  │ Dashboard       │  │  │ Admin Dashboard                          │  │
│  │ Claims          │  │  │ Platform overview                        │  │
│  │ Courts          │  │  └───────────────────────────────────────────┘  │
│  │ Users (future)  │  │                                                │
│  │                 │  │  STATS OVERVIEW                                │
│  │ ─────────────── │  │  ┌──────────┬──────────┬──────────┬──────────┐│
│  │                 │  │  │ Pending  │ Total    │ Reserv-  │ Active   ││
│  │ Admin Panel     │  │  │ Claims   │ Courts   │ able     │ Orgs     ││
│  │                 │  │  │    7     │   234    │   89     │   45     ││
│  │                 │  │  └──────────┴──────────┴──────────┴──────────┘│
│  │                 │  │                                                │
│  │                 │  │  PENDING CLAIMS                                │
│  │                 │  │  ┌───────────────────────────────────────────┐ │
│  │                 │  │  │ ⚠️ 7 claims awaiting review               │ │
│  │                 │  │  │                                           │ │
│  │                 │  │  │ ┌────────────────────────────────────────┐│ │
│  │                 │  │  │ │ Court Name      │ Org        │ 2h ago  ││ │
│  │                 │  │  │ │ Another Court   │ Club XYZ   │ 5h ago  ││ │
│  │                 │  │  │ │ Third Court     │ Sports Inc │ 1d ago  ││ │
│  │                 │  │  │ └────────────────────────────────────────┘│ │
│  │                 │  │  │                                           │ │
│  │                 │  │  │ [View All Claims →]                       │ │
│  │                 │  │  └───────────────────────────────────────────┘ │
│  │                 │  │                                                │
│  │                 │  │  RECENT ACTIVITY                              │
│  │                 │  │  ┌───────────────────────────────────────────┐ │
│  │                 │  │  │ ● Claim approved - Court A by Admin      │ │
│  │                 │  │  │ ● New curated court added - Court B      │ │
│  │                 │  │  │ ● Claim rejected - Court C               │ │
│  │                 │  │  │ ● Court deactivated - Court D            │ │
│  │                 │  │  └───────────────────────────────────────────┘ │
│  │                 │  │                                                │
│  └─────────────────┘  │                                                │
│                       │                                                │
└───────────────────────┴────────────────────────────────────────────────┘
```

### 1.2 Admin Sidebar

```tsx
// src/features/admin/components/admin-sidebar.tsx

const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Claims', href: '/admin/claims', icon: FileCheck, badge: pendingClaimsCount },
  { label: 'Courts', href: '/admin/courts', icon: Map },
  // Future items
  // { label: 'Users', href: '/admin/users', icon: Users },
  // { label: 'Analytics', href: '/admin/analytics', icon: BarChart },
]
```

---

## 2. Pending Claims Page

### Route: `/admin/claims`

### 2.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ADMIN NAVBAR + SIDEBAR                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PAGE HEADER                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Claim Requests                                                     ││
│  │  Review and process ownership claims                                ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FILTERS                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ [All Types ▼] [All Status ▼]                        [Search...]    ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TABS                                                                  │
│  [Pending (7)] [Approved] [Rejected]                                   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CLAIMS TABLE                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ ┌──────────┬────────────────┬──────────────┬──────────┬───────────┐││
│  │ │ Type     │ Court          │ Organization │ Submitted│ Actions   │││
│  │ ├──────────┼────────────────┼──────────────┼──────────┼───────────┤││
│  │ │ 🏷️ CLAIM │ Makati Courts  │ Sports Club  │ 2h ago   │ [Review]  │││
│  │ │          │ 📍 Makati      │ Juan Cruz    │          │           │││
│  │ ├──────────┼────────────────┼──────────────┼──────────┼───────────┤││
│  │ │ 🏷️ CLAIM │ BGC Pickleball │ Elite Play   │ 5h ago   │ [Review]  │││
│  │ │          │ 📍 Taguig      │ Maria Santos │          │           │││
│  │ ├──────────┼────────────────┼──────────────┼──────────┼───────────┤││
│  │ │ 🗑️ REMOVE│ Old Court      │ N/A          │ 1d ago   │ [Review]  │││
│  │ │          │ 📍 Quezon City │              │          │           │││
│  │ └──────────┴────────────────┴──────────────┴──────────┴───────────┘││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  PAGINATION                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │              [<] [1] [2] [3] [>]          Showing 1-10 of 15        ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Claim Type Badges

| Type | Badge Variant | Icon | Label |
|------|---------------|------|-------|
| `CLAIM` | `default` | Tag | "CLAIM" |
| `REMOVAL` | `destructive` | Trash | "REMOVAL" |

### 2.3 Removal Request Handling (PRD Section 6.3)

Removal requests appear in the same claims queue with type `REMOVAL`. Admin can:

1. **Approve Removal**:
   - Court deactivated or returned to curated status
   - Organization's ownership removed
   - All pending reservations cancelled
   - Owner notified

2. **Reject Removal**:
   - Court remains active under organization
   - Owner notified with reason

### 2.3 Status Badges

| Status | Badge Variant | Label |
|--------|---------------|-------|
| `PENDING` | `warning` | "Pending Review" |
| `APPROVED` | `success` | "Approved" |
| `REJECTED` | `secondary` | "Rejected" |

---

## 3. Claim Detail Page

### Route: `/admin/claims/[id]`

### 3.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ADMIN NAVBAR + SIDEBAR                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BREADCRUMB                                                            │
│  Admin > Claims > Claim #{id}                                          │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  STATUS BANNER                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ ⏳ PENDING REVIEW                                                   ││
│  │    Submitted 2 hours ago by Juan Cruz                               ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CLAIM DETAILS                                                         │
│  ┌─────────────────────────────────────────┬────────────────────────────┐
│  │                                         │                            │
│  │  COURT INFORMATION                      │  REVIEW ACTIONS            │
│  │  ┌─────────────────────────────────────┐│  ┌────────────────────────┐│
│  │  │ [Court Photo]                       ││  │ Decision               ││
│  │  │                                     ││  │                        ││
│  │  │ Makati Pickleball Courts            ││  │ ○ Approve Claim        ││
│  │  │ 📍 123 Ayala Ave, Makati City       ││  │ ○ Reject Claim         ││
│  │  │                                     ││  │                        ││
│  │  │ Status: Curated (Unclaimed)         ││  │ Review Notes:          ││
│  │  │ Listed: January 1, 2025             ││  │ ┌──────────────────────┐│
│  │  │                                     ││  │ │                      ││
│  │  │ [View Court Details →]              ││  │ │                      ││
│  │  └─────────────────────────────────────┘│  │ └──────────────────────┘│
│  │                                         │  │                        ││
│  │  CLAIMING ORGANIZATION                  │  │ [Submit Decision]      ││
│  │  ┌─────────────────────────────────────┐│  └────────────────────────┘│
│  │  │ [Logo] Sports Club Manila           ││                            │
│  │  │                                     ││                            │
│  │  │ Owner: Juan Cruz                    ││                            │
│  │  │ Email: juan@sportsclub.com          ││                            │
│  │  │ Phone: +63 917 123 4567             ││                            │
│  │  │                                     ││                            │
│  │  │ Registered: December 2024           ││                            │
│  │  │ Courts Owned: 2                     ││                            │
│  │  │                                     ││                            │
│  │  │ [View Organization →]               ││                            │
│  │  └─────────────────────────────────────┘│                            │
│  │                                         │                            │
│  │  REQUEST NOTES                          │                            │
│  │  ┌─────────────────────────────────────┐│                            │
│  │  │ "We have been operating this court  ││                            │
│  │  │  since 2023. I am the owner and     ││                            │
│  │  │  would like to enable online        ││                            │
│  │  │  reservations for our players."     ││                            │
│  │  └─────────────────────────────────────┘│                            │
│  │                                         │                            │
│  │  TIMELINE                               │                            │
│  │  ┌─────────────────────────────────────┐│                            │
│  │  │ ● Submitted      Jan 15, 2:30 PM    ││                            │
│  │  │                  By Juan Cruz       ││                            │
│  │  └─────────────────────────────────────┘│                            │
│  │                                         │                            │
│  └─────────────────────────────────────────┴────────────────────────────┘
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Review Actions Component

```tsx
// src/features/admin/components/claim-review-actions.tsx

interface ClaimReviewActionsProps {
  claimId: string
  onApprove: (notes?: string) => void
  onReject: (reason: string) => void
  isLoading: boolean
}

/* Specs:
 * - Radio buttons for decision
 * - Textarea for notes/reason
 * - Reason required for rejection
 * - Confirm dialog before action
 * - Loading state on submit
 */
```

### 3.3 Approval Flow

```tsx
// When approving a claim:
// 1. Show confirmation dialog
// 2. Explain what will happen:
//    - Court type changes from CURATED to RESERVABLE
//    - Organization gains ownership
//    - Curated details converted to reservable
// 3. Submit approval
// 4. Show success message
// 5. Redirect to claims list
```

### 3.4 Rejection Flow

```tsx
// When rejecting a claim:
// 1. Require rejection reason
// 2. Show confirmation dialog
// 3. Explain what will happen:
//    - Claim status changes to REJECTED
//    - Court remains as CURATED
//    - Requester will be notified
// 4. Submit rejection
// 5. Show success message
// 6. Redirect to claims list
```

---

## 4. All Courts Page (Admin)

### Route: `/admin/courts`

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ADMIN NAVBAR + SIDEBAR                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PAGE HEADER                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  All Courts                                  [+ Add Curated Court]  ││
│  │  Manage platform court listings                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FILTERS                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ [All Types ▼] [All Status ▼] [All Cities ▼] [Claim Status ▼]       ││
│  │                                              [Search court name...] ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  COURTS TABLE                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ ┌───────┬──────────────┬──────────┬──────────┬──────────┬─────────┐││
│  │ │       │ Name         │ Type     │ Owner    │ Status   │ Actions │││
│  │ ├───────┼──────────────┼──────────┼──────────┼──────────┼─────────┤││
│  │ │ [Img] │ Makati Court │ CURATED  │ -        │ ● Active │ [...]   │││
│  │ │       │ 📍 Makati    │ UNCLAIMED│          │          │         │││
│  │ ├───────┼──────────────┼──────────┼──────────┼──────────┼─────────┤││
│  │ │ [Img] │ BGC Court    │ RESERV.  │ Elite    │ ● Active │ [...]   │││
│  │ │       │ 📍 Taguig    │ CLAIMED  │ Sports   │          │         │││
│  │ ├───────┼──────────────┼──────────┼──────────┼──────────┼─────────┤││
│  │ │ [Img] │ Old Court    │ CURATED  │ -        │ ○ Inactive│ [...]   │││
│  │ │       │ 📍 QC        │ UNCLAIMED│          │          │         │││
│  │ └───────┴──────────────┴──────────┴──────────┴──────────┴─────────┘││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Admin Court Actions

```tsx
// Action menu for each court row
const adminCourtActions = (court: CourtRecord) => [
  { label: 'View Details', href: `/courts/${court.id}`, external: true },
  { label: 'Edit Court', href: `/admin/courts/${court.id}` },
  { type: 'separator' },
  court.isActive 
    ? { label: 'Deactivate', variant: 'warning', action: 'deactivate' }
    : { label: 'Activate', variant: 'success', action: 'activate' },
  { type: 'separator' },
  { label: 'View History', action: 'viewHistory' },
]
```

### 4.3 Filter Options

```tsx
// Court type filter
const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'CURATED', label: 'Curated' },
  { value: 'RESERVABLE', label: 'Reservable' },
]

// Claim status filter
const claimStatusOptions = [
  { value: 'all', label: 'All Claim Status' },
  { value: 'UNCLAIMED', label: 'Unclaimed' },
  { value: 'CLAIM_PENDING', label: 'Claim Pending' },
  { value: 'CLAIMED', label: 'Claimed' },
  { value: 'REMOVAL_REQUESTED', label: 'Removal Requested' },
]

// Active status filter
const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]
```

---

## 5. Create Curated Court Page

### Route: `/admin/courts/new`

### 5.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ADMIN NAVBAR + SIDEBAR                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PAGE HEADER                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Add Curated Court                                                  ││
│  │  Create a new public court listing                                  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CURATED COURT FORM                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │  BASIC INFORMATION                                                  ││
│  │  ─────────────────────────────────────────────────────────────────  ││
│  │                                                                     ││
│  │  Court Name *                                                       ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │                                                               │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Address *                                                          ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │                                                               │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  City *                                                             ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │                                                        ▼      │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Location (click on map to set pin)                                 ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │                                                               │  ││
│  │  │   [Interactive Map]                                           │  ││
│  │  │                                                               │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  CONTACT INFORMATION                                                ││
│  │  ─────────────────────────────────────────────────────────────────  ││
│  │                                                                     ││
│  │  Facebook Page URL                                                  ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ https://facebook.com/...                                      │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Instagram URL                                                      ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ https://instagram.com/...                                     │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Viber Contact                                                      ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ +63 917 123 4567                                              │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Website URL                                                        ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ https://...                                                   │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  Other Contact Info                                                 ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │ Any additional contact information...                         │  ││
│  │  │                                                               │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  PHOTOS & AMENITIES                                                 ││
│  │  ─────────────────────────────────────────────────────────────────  ││
│  │                                                                     ││
│  │  Photos                                                             ││
│  │  ┌───────┐  ┌───────────────┐                                       ││
│  │  │ [Img] │  │ + Add Photo   │                                       ││
│  │  │  [×]  │  │               │                                       ││
│  │  └───────┘  └───────────────┘                                       ││
│  │                                                                     ││
│  │  Amenities                                                          ││
│  │  ☐ Parking  ☐ Restrooms  ☐ Lights  ☐ Equipment  ...                ││
│  │                                                                     ││
│  │  ─────────────────────────────────────────────────────────────────  ││
│  │                                                                     ││
│  │                                     [Cancel]  [Create Court]        ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Curated Court Form Schema

```tsx
// src/features/admin/schemas/curated-court.schema.ts

import { z } from 'zod'

export const curatedCourtSchema = z.object({
  // Basic info
  name: z.string().min(1, 'Name is required').max(200),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required').max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  
  // Contact info (all optional for curated)
  facebookUrl: z.string().url().optional().or(z.literal('')),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  viberInfo: z.string().max(100).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  otherContactInfo: z.string().optional(),
  
  // Media
  photos: z.array(z.object({
    url: z.string().url(),
    displayOrder: z.number().int().min(0),
  })).max(10).optional(),
  
  amenities: z.array(z.string().max(100)).optional(),
})
```

---

## 6. Admin Court Edit Page

### Route: `/admin/courts/[id]`

Similar to the curated court creation form, but:
- Pre-populated with existing data
- Shows current court type (can't be changed)
- Shows claim status
- Shows ownership info (if claimed)
- Additional admin actions:
  - Deactivate/Activate
  - Force status changes
  - View audit history

---

## 7. Hooks & Data Fetching

### 7.1 Admin Hooks

```tsx
// src/features/admin/hooks/index.ts

// Get pending claims
export function usePendingClaims(pagination: PaginationDTO) {
  return trpc.admin.claim.getPending.useQuery(pagination)
}

// Get claim by ID
export function useClaimById(id: string) {
  return trpc.admin.claim.getById.useQuery({ id })
}

// Approve claim
export function useApproveClaim() {
  return trpc.admin.claim.approve.useMutation()
}

// Reject claim
export function useRejectClaim() {
  return trpc.admin.claim.reject.useMutation()
}

// List all courts (admin)
export function useAdminCourts(filters: AdminCourtFiltersDTO) {
  return trpc.admin.court.list.useQuery(filters)
}

// Create curated court
export function useCreateCuratedCourt() {
  return trpc.admin.court.createCurated.useMutation()
}

// Update court (admin)
export function useAdminUpdateCourt() {
  return trpc.admin.court.update.useMutation()
}

// Activate/Deactivate court
export function useToggleCourtStatus() {
  const activate = trpc.admin.court.activate.useMutation()
  const deactivate = trpc.admin.court.deactivate.useMutation()
  return { activate, deactivate }
}
```

---

## 8. Authorization

### 8.1 Admin Route Protection

```tsx
// src/app/(admin)/layout.tsx

import { redirect } from 'next/navigation'
import { getServerSession } from '@/shared/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/sign-in?callbackUrl=/admin')
  }
  
  // Check admin role
  const isAdmin = session.user.roles?.includes('ADMIN')
  
  if (!isAdmin) {
    redirect('/?error=unauthorized')
  }
  
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
```

### 8.2 Admin-Only Components

```tsx
// Wrapper for admin-only UI elements
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const isAdmin = session?.user.roles?.includes('ADMIN')
  
  if (!isAdmin) return null
  
  return <>{children}</>
}
```

---

## 9. Implementation Checklist

### 9.1 Dashboard

- [ ] Stats cards (claims, courts, orgs)
- [ ] Pending claims preview
- [ ] Recent activity feed
- [ ] Admin sidebar navigation

### 9.2 Claims Management

- [ ] Claims list with filters
- [ ] Status tabs
- [ ] Claim type badges (CLAIM and REMOVAL)
- [ ] Claim detail page
- [ ] Court info preview
- [ ] Organization info preview
- [ ] Request notes display
- [ ] Timeline display
- [ ] Approve claim action with confirmation
- [ ] Reject claim action with reason
- [ ] Approve removal action (PRD 6.3)
- [ ] Reject removal action with reason (PRD 6.3)
- [ ] Success/error handling

### 9.3 Courts Management

- [ ] Courts table with all filters
- [ ] Court type indicators
- [ ] Claim status indicators
- [ ] Owner info display
- [ ] Action menu per court
- [ ] Deactivate with reason
- [ ] Activate action
- [ ] Curated court form
- [ ] Map location picker
- [ ] Photo upload
- [ ] Amenities selection
- [ ] Contact info fields
- [ ] Admin court edit form

### 9.4 General

- [ ] Admin route protection
- [ ] Admin-only middleware
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states
- [ ] Confirmation dialogs

---

*End of UI Admin*
