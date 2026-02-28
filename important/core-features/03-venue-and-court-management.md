# Venue & Court Management (Owner Side)

## Purpose

This is where venue owners configure everything about their physical spaces — venues, courts, schedules, pricing, and add-ons. A fully configured venue is the prerequisite for receiving online bookings.

## Venue Management

### My Venues Page

The central hub for managing all venues under the owner's organization.

**What the owner sees:**
- Organization logo (uploadable)
- Verification status summary: counts of pending, verified, rejected, and unverified venues
- Venue cards, each showing:
  - Name, address, city
  - Verification status badge
  - Reservations enabled/disabled indicator (only shown if verified)
  - Sports offered
  - Court count
  - Actions: Manage Courts, Edit Venue, Go to Verification, View Public Page, Generate QR Code
- Empty state with call-to-action to create the first venue

### Creating / Editing a Venue

**What the owner provides:**
- Venue name
- Address, city, province
- Latitude/longitude (optional, for map placement)
- Phone number, email, website
- Social media links
- Description
- Sports offered (multi-select)
- Amenities (parking, lighting, showers, restrooms, etc.)
- Venue photos (upload, remove, reorder)

### Venue Verification

Before a venue can accept online bookings, it must pass ownership verification.

**How it works:**
1. Owner navigates to the verification page for their venue.
2. Uploads proof-of-ownership documents (government ID, business permit, lease agreement, utility bill, etc.).
3. Optionally adds notes explaining the documents.
4. Submits for admin review.

**Verification states:**
- **UNVERIFIED** — No submission yet
- **PENDING** — Documents submitted, waiting for admin review
- **VERIFIED** — Admin approved. Venue can accept online bookings.
- **REJECTED** — Admin declined. Owner must resubmit.

**After verification:**
- A toggle appears to enable/disable online reservations for the venue.
- The public listing shows a "Verified" badge.
- Players can now book courts at this venue.

### QR Code Generation

Owners can generate a QR code that links to their public venue page. Useful for displaying in the physical venue so walk-in customers can scan and book online.

## Court Management

### Courts Within a Venue

Each venue contains one or more courts. A court represents a single bookable unit (e.g., "Badminton Court 1", "Basketball Court A").

**What the owner configures per court:**
- Court label (name)
- Sport type (from platform sport catalog)
- Tier label (optional quality descriptor, e.g., "Premium", "Standard")
- Active/inactive status

### Creating a Court

1. Owner selects the venue.
2. Chooses a sport from the dropdown.
3. Enters a court label.
4. Optionally sets a tier label.
5. Saves. The court is created in "active" status.

A court must then be configured with a schedule and pricing before it is considered "ready" for bookings.

### Court Readiness

A court is "ready" (bookable) when it has:

1. Active status
2. At least one schedule block (operating hours defined)
3. At least one pricing rule (hourly rate set)

Courts that are active but lack schedule or pricing appear in the venue's court list but cannot receive bookings.

## Schedule Configuration

The schedule defines when a court is available for booking.

### How It Works

The owner configures availability on a per-day-of-week basis:

- **For each day (Monday through Sunday):**
  - One or more time blocks with a start time and end time
  - Each block has an hourly rate
  - Multiple blocks per day support tiered pricing (e.g., morning rate vs. evening rate)

**Example:**
| Day | Block 1 | Rate | Block 2 | Rate |
|-----|---------|------|---------|------|
| Monday | 6:00 AM – 12:00 PM | ₱300/hr | 12:00 PM – 10:00 PM | ₱500/hr |
| Saturday | 6:00 AM – 10:00 PM | ₱600/hr | — | — |
| Sunday | Closed | — | — | — |

**Validation rules:**
- Time blocks within the same day cannot overlap
- Start time must be before end time
- At least one block is needed for the court to be schedulable

### Availability Studio

The Availability Studio is a visual calendar interface for managing court availability at a more granular level.

**What the owner sees:**
- A weekly calendar timeline showing availability blocks per court
- Drag-to-create and drag-to-resize blocks
- Block types: available, reserved (by bookings), and custom blocks
- Day-by-day mobile view for smaller screens
- Quick actions to replace or manage individual blocks

**Business purpose:** While the schedule sets the recurring weekly pattern, the Availability Studio lets owners manage exceptions — blocking off a court for maintenance, adjusting hours for a holiday, etc.

## Add-On Configuration

Owners can define optional extras that players can purchase alongside their booking.

### Types of Add-Ons

- **Court-specific add-ons** — Available only for a particular court (e.g., premium lighting for an outdoor court)
- **Venue-wide add-ons** — Available across all courts at the venue (e.g., shoe rental, ball rental, towel service)

### What the Owner Configures Per Add-On

- Name and description
- Price
- Scope (specific court or all courts)
- Day availability (which days of the week the add-on is offered)

### How Players See Add-Ons

During the booking flow, after selecting a court and time, the player sees available add-ons with prices. They can toggle each one on or off. The total price updates in real time.

## Booking Imports

Owners can import existing bookings from an external system (spreadsheet, old booking tool, etc.) via CSV upload.

**How it works:**
1. Owner navigates to the Import page.
2. Uploads a CSV file with booking data.
3. The system creates an import job and processes the file.
4. Owner reviews the parsed results — sees a preview of each booking with mapped fields (player info, court, date/time, price).
5. Validation errors are highlighted (e.g., missing court, invalid date).
6. Owner confirms the import to create the bookings in the system.

**Use case:** Venue owners migrating from manual booking systems (paper, spreadsheet, Facebook messages) can bring their existing bookings into KudosCourts to avoid double-booking and have a complete history.

**Access:** Requires the "Create guest bookings" permission. Available to owners and managers.

## Owner Dashboard

The main landing page after login for venue owners.

**What the owner sees:**
- Welcome greeting
- Setup progress indicator (if onboarding is incomplete, shows the next step)
- Alert banners for:
  - Incomplete setup with link to the wizard
  - Missing payment method
  - Zero team members with notifications enabled
- Stats cards:
  - Active Courts count
  - Pending Bookings count
  - Today's Bookings count
  - Monthly Revenue (planned, not yet implemented)
- Two-panel layout:
  - Recent Activity feed (booking updates, claim status changes, verification results)
  - Today's Schedule (timeline of today's reservations)
- Floating reservation alerts panel
