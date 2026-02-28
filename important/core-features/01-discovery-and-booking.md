# Discovery & Booking (Player Side)

## Purpose

This is how players find venues and book courts. It is the top of the conversion funnel — every booking starts here.

## Landing Page

The public homepage introduces the platform and drives players into the discovery flow.

**What the player sees:**
- Hero section with a search form (search by location or sport)
- Popular location shortcuts (Manila, Davao City, Cebu City, Dumaguete, Quezon City)
- Feature overview explaining the before/after of manual booking vs. KudosCourts
- Featured venues section highlighting curated listings
- Call-to-action for venue owners to list their spaces
- FAQ section answering common player questions

**Business purpose:** Convert first-time visitors into active searchers. The popular location shortcuts reduce friction for users who do not know what to search for.

## Courts Browse

The main discovery surface where players explore available courts.

**What the player sees:**
- Paginated list of courts across all venues
- Two view modes: list view (cards) and map view (geographic pins)
- Advanced filters:
  - Province and City (Philippine location hierarchy)
  - Sport type (badminton, basketball, tennis, pickleball, etc.)
  - Amenities (parking, lighting, showers, etc.)
  - Verification status (Verified Reservable, Curated, Unverified Reservable)
- Each court card shows: cover image, venue name, sport types, court count, starting price, verification badge
- Search within results

**Map view:** Interactive map with markers for each court/venue. Players can zoom, pan, and click markers to see details.

**Location-based browse:** Players can navigate to location-specific pages (e.g., "Courts in Cebu City" or "Badminton Courts in Manila") which pre-filter results.

**Business purpose:** Help players find courts near them, filtered by what matters (sport, location, amenities). Map view is especially useful for players who think geographically ("What is closest to me?").

## Venue Detail Page

When a player clicks on a venue card, they see the full venue profile.

**What the player sees:**
- Venue name, address, city, province
- Verification badge (if verified for online reservations)
- Organization logo (if the venue belongs to a branded organization)
- Photo carousel of venue images
- Contact section (phone number if provided)
- List of all courts at the venue, each showing:
  - Court name/label
  - Sport type
  - Tier/quality label
  - Active status
- Verification messaging — if the venue is not yet available for online booking, the page explains why (pending verification, no payment method, etc.)

**Business purpose:** Build player trust. Verified badges, photos, and transparent information help the player decide if this venue is worth booking.

## Court Detail Page

Individual court information within a venue.

**What the player sees:**
- Court name, sport type, tier label
- Pricing information (per hour)
- Link to view the full venue
- Link to view availability/schedule

## Venue Schedule Page

Calendar view of court availability at a specific venue.

**What the player sees:**
- Weekly or date-range calendar showing all courts
- Time slots color-coded by status (available, booked, blocked)
- Court selector to filter which courts are shown
- Time zone aware display

**Business purpose:** The schedule view is the decision point — "Is the court available when I want to play?" A clear, visual schedule reduces booking abandonment.

## Booking Flow

The core conversion action — player selects a slot and creates a reservation.

### Happy Path

1. **Select a time slot** — Player picks an available slot from the schedule view or court detail page. The date picker is time-zone aware.
2. **Review booking details** — Court name, venue, date, start time, duration (default 60 minutes, configurable), and live price calculation.
3. **Select add-ons (optional)** — If the venue offers extras (shoe rental, ball rental, etc.), the player can add them. Each add-on shows its price.
4. **Multi-court option** — Player can add more courts to the same reservation group for a combined booking.
5. **Profile check** — The system checks if the player has a complete profile (name, email, phone). If incomplete, prompts the player to fill in missing fields before proceeding.
6. **Confirm booking** — Player agrees to terms and submits. A reservation is created with status "CREATED."
7. **Post-booking** — Player sees a confirmation screen with the reservation ID and next steps (payment instructions if applicable).

### Negative Paths

- **Slot no longer available** — If another player books the same slot before confirmation, the system rejects the request and the player must choose a different time.
- **Profile incomplete** — Booking is blocked until the player provides name, email, and phone number.
- **Venue not reservable** — If the venue is not verified, has no payment method, or has reservations disabled, the booking button is not shown. The page explains why.
- **Past time slot** — Cannot book a slot in the past. Validation prevents this.

### Open Play Option

After creating a reservation, the player can optionally convert it into an "Open Play" session — a social feature where other players can join and share the court cost. (See [07-open-play.md](./07-open-play.md) for details.)

## What Makes a Venue Bookable?

For a venue to appear as "reservable" in discovery, all of the following must be true:

- The venue is verified (admin approved the ownership documents)
- At least one court is active and "ready" (has both schedule and pricing configured)
- The organization has at least one active payment method
- Reservations are enabled by the owner (toggle in venue settings)

If any of these are missing, the venue still appears in search results but with messaging explaining why online booking is not available.
