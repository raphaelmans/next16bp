# Deferred Pages

**Status:** Not included in current UX flow plan  
**Review Date:** After Phase 5 completion

---

## Overview

These pages are not critical for the initial UX flow implementation. They can be added later as needed.

---

## High Priority

### `/owner/courts/[id]/edit`

**Purpose:** Edit existing court details

**Why Needed:**
- Owners need to update court info (photos, amenities, hours)
- Currently no way to edit after creation

**Implementation Notes:**
- Reuse `CourtForm` component from `/owner/courts/new`
- Pre-populate with existing court data
- Add "Edit" action to courts table

**Estimate:** 0.5 day

**Entry Points:**
- Owner courts table → "Edit" action
- Owner slot management → "Edit Court Details" link

---

## Medium Priority

### `/org/[slug]`

**Purpose:** Public organization profile page

**Why Needed:**
- Players want to see all courts from an organization
- Builds trust by showing organization info

**Features:**
- Organization header (logo, name, description)
- Contact information
- List of organization's courts
- "Contact" CTA

**Implementation Notes:**
- New route group or under `(public)`
- Fetch organization by slug
- List courts filtered by organizationId

**Estimate:** 1 day

**Entry Points:**
- Court detail page → Organization name link
- Search results → Organization filter (future)

---

### `/admin/courts/[id]`

**Purpose:** Admin view/edit of any court

**Why Needed:**
- Admins need to view and moderate all courts
- Ability to deactivate problematic courts

**Features:**
- Full court details (same as owner view)
- Admin-specific actions:
  - Activate/Deactivate court
  - Transfer ownership (future)
  - View audit history (future)
- Owner information section

**Implementation Notes:**
- Similar to owner court edit, with additional admin actions
- Different permission checks

**Estimate:** 1 day

**Entry Points:**
- Admin courts table → Row click or "View" action
- Admin claims detail → "View Court" link

---

## Low Priority

### `/owner/onboarding`

**Purpose:** New owner onboarding flow

**Why Needed:**
- Better first-time experience for court owners
- Guides through organization + court setup

**Features:**
- Step 1: Create organization (name, logo)
- Step 2: Add first court (basic info)
- Step 3: Set up payment info
- Step 4: Add time slots
- Completion celebration

**Implementation Notes:**
- Multi-step wizard component
- Progress indicator
- Skip options for optional steps
- Redirect from `/owner` if no org exists

**Estimate:** 2 days

**Entry Points:**
- "List Your Court" CTA (if no organization)
- `/owner` redirect (if no organization)

---

### `/courts/[id]/claim`

**Purpose:** Claim a curated court listing

**Why Needed:**
- Convert curated courts to reservable
- Owners can claim their existing listings

**Features:**
- Court preview card
- Benefits explanation
- Organization selector (or create new)
- Claim request form (notes, proof)
- Terms acceptance

**Implementation Notes:**
- Only show for CURATED courts
- Creates claim request (pending admin approval)
- Link from court detail page

**Estimate:** 1 day

**Entry Points:**
- Court detail page → "Claim This Court" button (curated only)
- Landing page → "Claim your court listing" section

---

### `/owner/analytics`

**Purpose:** Revenue and booking analytics for owners

**Why Needed:**
- Owners want to track performance
- Identify popular times, revenue trends

**Features:**
- Revenue over time chart
- Booking count by day/week/month
- Popular time slots
- Court comparison (if multiple)
- Export to CSV

**Implementation Notes:**
- Requires backend analytics endpoints
- Use charting library (e.g., recharts)

**Estimate:** 3 days (includes backend)

**Entry Points:**
- Owner sidebar → "Analytics" link
- Owner dashboard → "View Analytics" CTA

---

### `/admin/users`

**Purpose:** User management for admins

**Why Needed:**
- Admins need to view/manage users
- Handle support issues, role changes

**Features:**
- Users list with search
- User detail view
- Role management
- Account actions (disable, delete)

**Implementation Notes:**
- Requires backend user management endpoints
- Careful permission handling

**Estimate:** 2 days

**Entry Points:**
- Admin sidebar → "Users" link
- Admin dashboard → "Active Users" stat

---

## Implementation Order Recommendation

When prioritizing deferred pages, suggest this order:

1. **`/owner/courts/[id]/edit`** - High value, low effort, completes CRUD
2. **`/admin/courts/[id]`** - Enables full admin moderation
3. **`/org/[slug]`** - Improves discovery experience
4. **`/courts/[id]/claim`** - Enables organic growth
5. **`/owner/onboarding`** - Improves owner conversion
6. **`/owner/analytics`** - Nice to have
7. **`/admin/users`** - Admin tooling

---

## Notes

- Each page should follow existing patterns and design system
- Reuse existing components where possible
- Add to navigation when implemented
- Update this document when pages are completed
