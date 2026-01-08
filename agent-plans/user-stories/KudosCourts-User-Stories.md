# KudosCourts User Stories

**Product Requirements Document**  
**Version:** 1.0  
**Date:** January 7, 2026  

---

## Table of Contents

1. [Onboarding](#1-onboarding)
   - US-00-01: User Authentication Flow
   - US-00-02: User Completes Profile
   - US-00-03: User Navigates Public Area
   - US-00-04: User Navigates Account Area
   - US-00-05: Owner Navigates Dashboard
   - US-00-06: Admin Navigates Dashboard
   - US-00-07: Home Page for Authenticated Users

2. [Organization](#2-organization)
   - US-01-01: Owner Registers Organization

3. [Court Creation](#3-court-creation)
   - US-02-01: Admin Creates Curated Court
   - US-02-02: Owner Creates Court

4. [Court Reservation](#4-court-reservation)
   - US-03-01: Player Books Free Court
   - US-03-02: Player Books Paid Court
   - US-03-03: Owner Confirms Payment

---

<div style="page-break-after: always;"></div>

# 1. Onboarding

The Onboarding feature domain covers the complete user journey from first visit through authenticated platform usage. This includes authentication flows (sign up, sign in, sign out), profile completion, and navigation patterns across all platform areas.

KudosCourts follows a player-first approach where users can discover courts without authentication, but must sign in to make reservations. The onboarding experience is designed to be minimal-friction while ensuring users provide necessary contact information for bookings. Authenticated users land on a personalized `/home` page that serves as a central hub for quick actions and status updates.

**Stories in this domain:** 7 Active

---

## US-00-01: User Authentication Flow

**Status:** Active

### Story

As a **user**, I want to **sign up, sign in, and sign out** so that **I can access platform features like reservations and profile management**.

### Acceptance Criteria

#### Sign Up (Email/Password)

- Given I am on `/register`
- When I submit a valid email and password (min 8 characters)
- Then my account is created and I see "Check your email for confirmation"

#### Sign Up (Magic Link)

- Given I am on `/magic-link`
- When I submit a valid email
- Then a magic link is sent and I see "Check your email for the login link"

#### Sign In

- Given I am on `/login` with valid credentials
- When I submit the form
- Then I am authenticated and redirected to `/home` (or `?redirect` param if present)

#### Sign Out

- Given I am authenticated
- When I click "Sign Out" in the user dropdown
- Then my session is cleared and I am redirected to `/`

#### Redirect Preservation

- Given I am on a protected page (e.g., `/courts/123/book/456`) as a guest
- When I am redirected to `/login`
- Then the original URL is preserved in `?redirect` param
- And after successful login I return to that page

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Invalid email format | Show validation error inline |
| Password too short (< 8 chars) | Show validation error inline |
| Email already registered | Show "Email already in use" error |
| Invalid credentials on login | Show "Invalid email or password" error |
| Expired magic link | Show "Link expired, request a new one" with retry CTA |
| Network error during auth | Show toast error with retry option |

### UI Components

| Page | Route | Components |
|------|-------|------------|
| Login | `/login` | LoginForm, links to register/magic-link |
| Register | `/register` | RegisterForm, link to login |
| Magic Link | `/magic-link` | MagicLinkForm, link to login |

---

## US-00-02: User Completes Profile

**Status:** Active

### Story

As a **user**, I want to **complete my profile with minimal information** so that **I can make reservations and optionally become a court owner**.

### Acceptance Criteria

#### View Profile

- Given I am authenticated
- When I navigate to `/account/profile`
- Then I see my current profile information (display name, email, phone, avatar)

#### Update Profile

- Given I am on `/account/profile`
- When I update any field and click Save
- Then my profile is updated and I see a success toast

#### Profile Auto-Creation

- Given I am a new user with no profile
- When I first access `/account/profile` or `/home`
- Then a profile is automatically created for me (empty fields)

#### Minimum Required for Booking

- Given I try to book a court
- When my profile is missing display name AND (email AND phone)
- Then I am prompted to complete minimum fields before proceeding

#### Become Owner CTA

- Given I am on `/account/profile` and have no organization
- When I view the page
- Then I see a "Want to list your courts?" CTA section

### Profile Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Display Name | text | For booking | 1-100 chars |
| Email | email | Either email or phone | Valid email format |
| Phone Number | tel | Either email or phone | Max 20 chars |
| Avatar URL | url | No | Valid URL |

### Profile Completeness

**Minimum for Booking:**
- Display name (required)
- Email OR phone (at least one)

**Complete Profile:**
- Display name
- Email
- Phone
- Avatar (optional, not counted)

---

## US-00-03: User Navigates Public Area

**Status:** Active

### Story

As a **user**, I want to **navigate the public discovery area with clear wayfinding** so that **I can find courts and understand where I am in the platform**.

### Acceptance Criteria

#### Navbar (Guest)

- Given I am not authenticated
- When I view the discovery navbar
- Then I see: Logo (links to `/`), Browse Courts, Sign In button

#### Navbar (Authenticated)

- Given I am authenticated
- When I view the discovery navbar
- Then I see: Logo (links to `/home`), Browse Courts, User dropdown
- And the dropdown shows: My Reservations, Profile, Owner Dashboard (if owner), Admin Dashboard (if admin), Sign Out

#### Logo Navigation

- Given I am authenticated and click the logo → Navigate to `/home`
- Given I am NOT authenticated and click the logo → Navigate to `/`

#### Court Detail Breadcrumbs

- Given I am on `/courts/[id]`
- When I view the page header
- Then I see breadcrumbs: Home > Courts > {Court Name}

#### Booking Flow Breadcrumbs

- Given I am on `/courts/[id]/book/[slotId]`
- When I view the page header
- Then I see breadcrumbs: Courts > {Court Name} > Book
- And I see a back button to `/courts/[id]`

### Navigation Patterns

| Page | Breadcrumbs | Back Button |
|------|-------------|-------------|
| `/` | No | No |
| `/courts` | No | No |
| `/courts/[id]` | Home > Courts > {Name} | No |
| `/courts/[id]/book/[slotId]` | Courts > {Name} > Book | Yes, to `/courts/[id]` |

---

## US-00-04: User Navigates Account Area

**Status:** Active

### Story

As an **authenticated user**, I want to **navigate account-related pages with clear back navigation** so that **I can manage my profile and reservations without getting lost**.

### Acceptance Criteria

#### Profile Page Navigation

- Given I am on `/account/profile`
- When I view the page header
- Then I see breadcrumbs: Account > Profile
- And I see a back button to `/home`

#### Reservations List

- Given I am on `/reservations`
- When I view the page header
- Then I see title "My Reservations" (top-level, no breadcrumbs needed)

#### Reservation Detail

- Given I am on `/reservations/[id]`
- When I view the page header
- Then I see breadcrumbs: My Reservations > Details
- And I see a back button to `/reservations`

#### Payment Page

- Given I am on `/reservations/[id]/payment`
- When I view the page header
- Then I see breadcrumbs: My Reservations > Details > Payment
- And I see a back button to `/reservations/[id]`

### Navigation Patterns

| Page | Breadcrumbs | Back Button | Destination |
|------|-------------|-------------|-------------|
| `/account/profile` | Account > Profile | Yes | `/home` |
| `/reservations` | My Reservations | No | - |
| `/reservations/[id]` | My Reservations > Details | Yes | `/reservations` |
| `/reservations/[id]/payment` | ...Details > Payment | Yes | `/reservations/[id]` |

---

## US-00-05: Owner Navigates Dashboard

**Status:** Active

### Story

As an **organization owner**, I want to **navigate the owner dashboard with a consistent sidebar and breadcrumbs** so that **I can efficiently manage my courts and reservations**.

### Acceptance Criteria

#### Sidebar Navigation

- Given I am on any `/owner/*` page
- When I view the sidebar
- Then I see: Dashboard, My Courts, Reservations, Settings
- And the current page is highlighted with active state

#### Active State

- Given I am on `/owner/courts`
- When I view the sidebar
- Then "My Courts" has: bg-primary/10, text-primary, left border accent

#### Breadcrumbs on Nested Pages

- `/owner/courts/new` → Breadcrumbs: My Courts > New Court, Back to `/owner/courts`
- `/owner/courts/[id]/slots` → Breadcrumbs: My Courts > {Court Name} > Manage Slots

#### Cross-Dashboard Navigation

- Given I am on the owner dashboard
- When I click the user dropdown
- Then I see: Back to Player View, My Reservations, Admin Dashboard (if admin), Profile, Sign Out

### Navigation Patterns

| Page | Sidebar Active | Breadcrumbs | Back Button |
|------|----------------|-------------|-------------|
| `/owner` | Dashboard | No | No |
| `/owner/courts` | My Courts | No | No |
| `/owner/courts/new` | My Courts | My Courts > New Court | Yes |
| `/owner/courts/[id]/slots` | My Courts | My Courts > {Name} > Slots | Yes |
| `/owner/reservations` | Reservations | No | No |
| `/owner/settings` | Settings | No | No |

---

## US-00-06: Admin Navigates Dashboard

**Status:** Active

### Story

As a **platform admin**, I want to **navigate the admin dashboard with a consistent sidebar and notification badges** so that **I can efficiently manage claims and curated courts**.

### Acceptance Criteria

#### Sidebar Navigation

- Given I am on any `/admin/*` page
- When I view the sidebar
- Then I see: Dashboard, Claims (with badge), Courts
- And the current page is highlighted with active state

#### Claims Badge

- Given there are pending claim requests
- When I view the sidebar
- Then the Claims item shows a badge with the pending count

#### Breadcrumbs on Nested Pages

- `/admin/claims/[id]` → Breadcrumbs: Claims > Claim #{id}
- `/admin/courts/new` → Breadcrumbs: Courts > New Curated Court

### Navigation Patterns

| Page | Sidebar Active | Breadcrumbs | Back Button |
|------|----------------|-------------|-------------|
| `/admin` | Dashboard | No | No |
| `/admin/claims` | Claims | No | No |
| `/admin/claims/[id]` | Claims | Claims > Claim #{id} | Yes |
| `/admin/courts` | Courts | No | No |
| `/admin/courts/new` | Courts | Courts > New Curated Court | Yes |

---

## US-00-07: Home Page for Authenticated Users

**Status:** Active

### Story

As an **authenticated user**, I want to **see a personalized home page after login** so that **I can quickly access my bookings, profile, and relevant actions**.

### Acceptance Criteria

#### Welcome Header

- Given I am authenticated with a display name → See "Welcome back, {displayName}"
- Given I am authenticated without a display name → See "Welcome back!"

#### Quick Actions

- Given I am on `/home`
- Then I see cards for: Find Courts, My Bookings, Profile
- If I have an organization → Also see "Owner Dashboard" card
- If I am an admin → Also see "Admin Dashboard" card

#### Upcoming Reservations

- Given I have upcoming reservations → See up to 3 reservations with court name, location, date/time, status badge
- Given I have no upcoming reservations → See empty state with "Browse Courts" CTA

#### Your Organization Section

- Given I have an organization → See org name, court count, pending reservations, "Go to Dashboard" link
- Given I have no organization → See "Become a Court Owner" CTA card

#### Profile Completion Banner

- Given my profile is incomplete → See dismissible banner prompting completion
- Given I dismiss the banner → Not shown again (localStorage)

### Quick Action Cards

| Action | Icon | Href | Condition |
|--------|------|------|-----------|
| Find Courts | Search | `/courts` | Always |
| My Bookings | CalendarDays | `/reservations` | Always |
| Profile | User | `/account/profile` | Always |
| Owner Dashboard | Building2 | `/owner` | hasOrganization |
| Admin Dashboard | Shield | `/admin` | isAdmin |

---

<div style="page-break-after: always;"></div>

# 2. Organization

The Organization feature domain covers the self-registration flow for users who want to become court owners. This enables any authenticated user to create an organization, which is a prerequisite for listing and managing courts on the platform.

Organizations represent court owners/operators in the multi-tenant system. Each organization can own multiple courts, and the organization profile provides public-facing business information.

**Stories in this domain:** 1 Active

---

## US-01-01: Owner Registers Organization

**Status:** Active

### Story

As a **user**, I want to **create an organization** so that **I can list and manage my pickleball courts on the platform**.

### Acceptance Criteria

#### Access Onboarding

- Given I am authenticated and have no organization
- When I click the "Become a Court Owner" CTA on `/home` or `/account/profile`
- Then I navigate to `/owner/onboarding`

#### Create Organization

- Given I am on `/owner/onboarding`
- When I enter an organization name and submit
- Then an organization is created with auto-generated slug
- And I am redirected to `/owner`

#### Custom Slug

- Given I am on `/owner/onboarding`
- When I provide a custom slug
- Then the system validates it is unique
- And uses my custom slug if valid

#### Auto-Generated Slug

- Given I submit organization name "My Sports Complex"
- When no custom slug is provided
- Then the slug is generated as "my-sports-complex"

#### Slug Conflict

- Given the slug "my-courts" already exists
- When I try to use it
- Then the system appends a number: "my-courts-1"

#### Already Has Organization

- Given I already have an organization
- When I try to access `/owner/onboarding`
- Then I am redirected to `/owner`

### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Organization Name | text | Yes | 1-150 chars |
| Slug | text | No | Lowercase, alphanumeric, hyphens only, 1-100 chars |

### Post-Creation Flow

```
/owner/onboarding → [Create Organization] → /owner (Dashboard) → /owner/courts/new
```

### API Endpoint

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `organization.create` | Mutation | `{ name, slug? }` | `{ organization, profile }` |

---

<div style="page-break-after: always;"></div>

# 3. Court Creation

The Court Creation feature domain enables two types of court listings:

**Curated Courts** - Created by platform administrators to populate the discovery experience before owners onboard. These are view-only listings with external contact information.

**Owner Courts** - Created by organization owners who want to accept reservations through KudosCourts. These courts are immediately reservable.

**Stories in this domain:** 2 Active

---

## US-02-01: Admin Creates Curated Court

**Status:** Active

### Story

As an **admin**, I want to **create a curated court listing** so that **players can discover courts before owners onboard the platform**.

### Acceptance Criteria

#### Access Form

- Given I am an admin on `/admin/courts`
- When I click "Add Court"
- Then I navigate to `/admin/courts/new`

#### Create Court

- Given I am on `/admin/courts/new`
- When I fill required fields (name, address, city) and submit
- Then a court is created with `type: CURATED`, `claimStatus: UNCLAIMED`

#### Add Photos & Amenities

- Photos are saved and associated with the court
- Amenities are linked from predefined list

#### Add Contact Socials

- Contact links (Facebook, Viber, Instagram, website) saved in curated court detail

#### View in Discovery

- Court appears in results with "Contact to Book" label (not reservable)

### Form Fields

**Required:**
| Field | Type | Validation |
|-------|------|------------|
| Name | text | 1-150 chars |
| Address | text | 1-200 chars |
| City | text | 1-100 chars |

**Optional:**
| Field | Type | Validation |
|-------|------|------------|
| Description | textarea | Max 1000 chars |
| Photos | url[] | Valid URLs |
| Amenities | multi-select | Predefined list |
| Facebook URL | url | Valid URL |
| Viber | text | Phone or link |
| Instagram | text | Handle or URL |
| Website | url | Valid URL |

### Curated Court Display

Players see curated courts with:
- Court name and location
- Photos (or placeholder)
- Amenities badges
- "Contact to Book" badge (not a reserve button)
- Social/contact links to reach the owner externally

---

## US-02-02: Owner Creates Court

**Status:** Active

### Story

As an **organization owner**, I want to **create my own court** so that **players can discover and book it through the platform**.

### Acceptance Criteria

#### Access Form

- Given I am an owner on `/owner/courts`
- When I click "Add Court"
- Then I navigate to `/owner/courts/new`

#### Create Court

- Given I am on `/owner/courts/new`
- When I fill required fields and submit
- Then a court is created with `type: RESERVABLE`, linked to my organization

#### Set Default Pricing

- Configure default hourly rate and currency for new time slots

#### Post-Creation Redirect

- Redirected to `/owner/courts/[id]/slots` to manage availability

#### View in Discovery

- Court appears (shows "No availability" until slots are added)

#### No Organization

- If no organization → Redirect to `/owner/onboarding`

### Form Fields

**Required:**
| Field | Type | Validation |
|-------|------|------------|
| Name | text | 1-150 chars |
| Address | text | 1-200 chars |
| City | text | 1-100 chars |

**Optional:**
| Field | Type | Validation |
|-------|------|------------|
| Description | textarea | Max 1000 chars |
| Photos | url[] | Valid URLs |
| Amenities | multi-select | Predefined list |
| Default Hourly Rate | number | Min 0 |
| Currency | select | ISO 4217 (default: PHP) |

### Post-Creation Flow

```
/owner/courts/new → [Create Court] → /owner/courts/[id]/slots → Add time slots
```

---

<div style="page-break-after: always;"></div>

# 4. Court Reservation

The Court Reservation feature domain enables players to discover and book pickleball courts. This covers the complete player journey from court discovery through booking confirmation.

**Free Court Booking** - Immediate confirmation with no payment required.

**Paid Court Booking** - P2P payment model where the player pays externally (GCash, bank transfer, cash) and the owner confirms receipt. A 15-minute TTL window ensures fair slot availability.

**Stories in this domain:** 3 Active

---

## US-03-01: Player Books Free Court

**Status:** Active

### Story

As a **player**, I want to **book a free court slot** so that **I can play pickleball without any payment required**.

### Acceptance Criteria

#### View Availability

- Given I am on a court detail page (`/courts/[id]`)
- When the court has available free slots
- Then I see time slots displayed with "Free" badge

#### Select Slot

- Click available free slot → Booking modal/page opens showing slot details

#### Confirm Booking (Authenticated)

- Given I am authenticated with complete profile
- When I click "Reserve" on a free slot
- Then reservation is created with status `CONFIRMED`
- And slot status changes to `BOOKED`

#### Guest Booking Redirect

- Not authenticated → Redirect to `/login?redirect=/courts/[id]/book/[slotId]`

#### Profile Incomplete

- Missing required fields → Prompted to complete minimum profile fields

#### View Confirmation

- See court name, date, time, and "Confirmed" status
- Option to view in "My Reservations"

### Minimum Profile for Booking

| Field | Required |
|-------|----------|
| Display Name | Yes |
| Email | Either email or phone |
| Phone | Either email or phone |

### Booking Flow

```
/courts/[id] → Select free slot → /courts/[id]/book/[slotId] → [Reserve] → Success confirmation
```

---

## US-03-02: Player Books Paid Court

**Status:** Active

### Story

As a **player**, I want to **book a paid court slot** so that **I can reserve premium court time with external payment**.

### Acceptance Criteria

#### View Pricing

- See time slots with price badges (e.g., "P200/hr")

#### Initiate Booking

- Given I am authenticated with complete profile
- When I click a paid slot and confirm
- Then reservation is created with status `AWAITING_PAYMENT`
- And slot status changes to `HELD`
- And 15-minute countdown timer starts

#### View Payment Instructions

- Redirected to `/reservations/[id]/payment`
- See: amount due, payment methods (GCash, bank), countdown timer

#### Mark as Paid

- Accept Terms & Conditions checkbox (required)
- Optionally enter reference number/notes
- Status changes to `PAYMENT_MARKED_BY_USER`

#### Timer Expiration

- 15 minutes passed without marking payment
- Reservation status → `EXPIRED`
- Slot status → `AVAILABLE`
- Show "Reservation expired" message

#### Awaiting Owner Confirmation

- After marking payment → "Awaiting confirmation" status
- Reservation remains visible in My Reservations

### Payment Page Layout

```
┌─────────────────────────────────────────────┐
│  Complete Your Payment                       │
│                                             │
│  Amount Due: P200                           │
│  Time Remaining: 12:34                      │
│  [████████████░░░░░░░░]                     │
│                                             │
│  Payment Methods:                           │
│  GCash: 0917-123-4567                       │
│  Bank: BDO 1234-5678-9012 (Juan Dela Cruz)  │
│                                             │
│  Reference Number (optional): ___________   │
│  Notes (optional): ___________              │
│                                             │
│  [x] I have read and accept the T&C         │
│                                             │
│  [I Have Paid]                              │
└─────────────────────────────────────────────┘
```

### Booking Flow

```
/courts/[id] → Select paid slot → [Reserve] (AWAITING_PAYMENT, slot HELD)
    → /reservations/[id]/payment → [I Have Paid] (PAYMENT_MARKED_BY_USER)
    → Owner confirms → CONFIRMED, slot BOOKED
```

---

## US-03-03: Owner Confirms Payment

**Status:** Active

### Story

As an **organization owner**, I want to **confirm player payments** so that **reservations are finalized and players can use the court**.

### Acceptance Criteria

#### View Pending Reservations

- On `/owner/reservations` with filter "Pending Confirmation"
- See reservations with status `PAYMENT_MARKED_BY_USER`

#### View Reservation Details

- See: player info, court, slot details, payment proof (if provided)

#### Confirm Payment

- Click "Confirm Payment"
- Reservation status → `CONFIRMED`
- Slot status → `BOOKED`
- Success toast shown

#### Reject Payment

- Click "Reject" and provide a reason
- Reservation status → `CANCELLED`
- Slot status → `AVAILABLE`
- Confirmation toast shown

#### Dashboard Badge

- Badge count on "Reservations" sidebar item
- Dashboard shows pending count in stats

### Reservation Detail View

```
┌─────────────────────────────────────────────┐
│  Reservation #abc123                         │
│  Status: [Awaiting Confirmation]             │
│                                             │
│  Player Information:                         │
│  Name: Juan Dela Cruz                        │
│  Email: juan@email.com                       │
│  Phone: 0917-123-4567                        │
│                                             │
│  Booking Details:                            │
│  Court: Court A                              │
│  Date: January 8, 2025                       │
│  Time: 2:00 PM - 3:00 PM                     │
│  Amount: P200                                │
│                                             │
│  Payment Proof:                              │
│  Reference: GC-12345678                      │
│  Notes: "Paid via GCash"                     │
│                                             │
│  [Reject]              [Confirm Payment]     │
└─────────────────────────────────────────────┘
```

### Owner Reservation Flow

```
/owner → [Pending: 3] badge → /owner/reservations?status=pending
    → Click reservation → View details modal
    → [Confirm Payment] → CONFIRMED, slot BOOKED
    OR
    → [Reject] → CANCELLED, slot AVAILABLE
```

---

<div style="page-break-after: always;"></div>

# Summary

## Story Count by Domain

| Domain | Total | Active | Superseded |
|--------|-------|--------|------------|
| Onboarding | 7 | 7 | 0 |
| Organization | 1 | 1 | 0 |
| Court Creation | 2 | 2 | 0 |
| Court Reservation | 3 | 3 | 0 |
| **Total** | **13** | **13** | **0** |

## User Personas

| Persona | Description |
|---------|-------------|
| **Player** | Discovers and books courts through the platform |
| **Owner** | Organization owner who lists and manages courts |
| **Admin** | Platform administrator who manages curated courts and claims |

## Key Flows

1. **Authentication** → Profile Completion → Court Discovery → Booking
2. **Owner Onboarding** → Organization Creation → Court Creation → Slot Management
3. **Paid Booking** → Payment Window (15 min) → Owner Confirmation

---

*Document generated from user stories located in `/agent-plans/user-stories/`*
