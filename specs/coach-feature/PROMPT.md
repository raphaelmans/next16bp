# Coach Feature — First-class coach entity with discovery, booking, and management portal

## Objective

Add a self-managed "coach" primitive to KudosCourts. Coaches get their own explore/discovery page, booking lifecycle (mirroring court reservations), and a dedicated management portal. A coach is always a real user, can operate standalone or be attached to one or more venues, and controls their own schedule, pricing, and bookings.

## Key Requirements

### Schema (17 new tables, 1 modified)

Create all Drizzle schema files in `src/lib/shared/infra/db/schema/`:

- **`coach.ts`** — `coach` table (id, userId FK→auth.users UNIQUE, profileId FK→profile UNIQUE, name, slug UNIQUE, tagline, bio, introVideoUrl, yearsOfExperience, playingBackground, coachingPhilosophy, city, province, country DEFAULT 'PH', latitude, longitude, timeZone DEFAULT 'Asia/Manila', willingToTravel, onlineCoaching, baseHourlyRateCents, baseHourlyRateCurrency DEFAULT 'PHP', isActive DEFAULT true, featuredRank DEFAULT 0, provinceRank DEFAULT 0, createdAt, updatedAt) + `coachContactDetail` 1:1 (phoneNumber, facebookUrl, instagramUrl, websiteUrl)
- **`coach-sport.ts`** — `coachSport` (coachId FK, sportId FK, UNIQUE coachId+sportId)
- **`coach-certification.ts`** — `coachCertification` (coachId FK, name, issuingBody, level)
- **`coach-specialty.ts`** — `coachSpecialty` (coachId FK, name, UNIQUE coachId+name)
- **`coach-skill-level.ts`** — `coachSkillLevel` (coachId FK, level enum BEGINNER|INTERMEDIATE|ADVANCED|COMPETITIVE, UNIQUE coachId+level)
- **`coach-age-group.ts`** — `coachAgeGroup` (coachId FK, ageGroup enum KIDS|TEENS|ADULTS|SENIORS, UNIQUE coachId+ageGroup)
- **`coach-session-type.ts`** — `coachSessionType` (coachId FK, sessionType enum PRIVATE|SEMI_PRIVATE|GROUP, UNIQUE coachId+sessionType)
- **`coach-session-duration.ts`** — `coachSessionDuration` (coachId FK, durationMinutes CHECK IN 30/60/90/120, UNIQUE coachId+durationMinutes)
- **`coach-photo.ts`** — `coachPhoto` (coachId FK, url, displayOrder) INDEX(coachId, displayOrder)
- **`coach-venue.ts`** — `coachVenue` (coachId FK, placeId FK, status enum PENDING|ACCEPTED|DECLINED|REMOVED, invitedByUserId FK, respondedAt, UNIQUE coachId+placeId WHERE status IN PENDING/ACCEPTED)
- **`coach-hours.ts`** — `coachHoursWindow` (coachId FK, dayOfWeek 0-6, startMinute 0-1439, endMinute 1-1440, isAvailable) same pattern as `court_hours_window`
- **`coach-block.ts`** — `coachBlock` (coachId FK, startTime, endTime, reason, blockType enum PERSONAL|EXTERNAL_BOOKING|OTHER) same pattern as `court_block`
- **`coach-rate-rule.ts`** — `coachRateRule` (coachId FK, dayOfWeek, startMinute, endMinute, hourlyRateCents, currency) same pattern as `court_rate_rule`
- **`coach-addon.ts`** — `coachAddon` (coachId FK, label, isActive, mode OPTIONAL|AUTO, pricingType HOURLY|FLAT, flatFeeCents, flatFeeCurrency, displayOrder) + `coachAddonRateRule` (addonId FK, dayOfWeek, startMinute, endMinute, hourlyRateCents, currency) same pattern as `court_addon`/`court_addon_rate_rule`
- **`coach-payment-method.ts`** — `coachPaymentMethod` (coachId FK, type, provider, accountName, accountNumber, instructions, isActive, isDefault) same pattern as `organization_payment_method`
- **`coach-review.ts`** — `coachReview` (coachId FK, authorUserId FK, rating 1-5, body, removedAt, removedByUserId, removalReason, UNIQUE coachId+authorUserId WHERE removedAt IS NULL) same pattern as `place_review`

**Modify `reservation` table:** Add nullable `coachId` UUID FK→coach (SET NULL). Add CHECK: exactly one of `courtId` OR `coachId` must be non-null (XOR). Add indexes: `idx_reservation_coach`, `idx_reservation_coach_start`, `idx_reservation_active_coach_time` (partial, active statuses).

**New enums** in `enums.ts`: `coachSkillLevelEnum`, `coachAgeGroupEnum`, `coachSessionTypeEnum`, `coachVenueStatusEnum`, `coachBlockTypeEnum`

Add all indexes, check constraints, and trigram GIN indexes for coach name search. Export everything from schema `index.ts`. Run `pnpm db:generate` then `pnpm db:migrate`.

### Backend Modules

Follow existing repository → service → router layering. Use `DbClient` from `src/lib/shared/infra/db/drizzle.ts`.

**`src/lib/modules/coach/`** — Coach CRUD + Discovery
- Repository: `findById`, `findByUserId`, `findBySlug`, `findByIdOrSlug`, `findByIdForUpdate`, `findWithDetails`, `create`, `update`, child entity replace methods (sports, certifications, specialties, skill levels, age groups, session types, durations), `upsertContactDetail`, `list(filters)`, `listSummary(filters)`, `listCardMediaByCoachIds`, `listCardMetaByCoachIds`
- Service: `createCoach`, `updateCoach`, `getCoachByUserId`, `deactivateCoach` (coach.service.ts) + `getCoachByIdOrSlug`, `listCoachSummaries`, `listCoachCardMediaByIds`, `listCoachCardMetaByIds`, `getPublicStats` (coach-discovery.service.ts)
- DTOs: `CreateCoachSchema`, `UpdateCoachSchema`, `ListCoachesSchema` (filters: q, province, city, sportId, minRate, maxRate, minRating, skillLevel, ageGroup, sessionType, verified, venueId, limit, offset)
- Router: public procedures (listSummary, cardMediaByIds, cardMetaByIds, getByIdOrSlug, stats) + protected (getMyProfile, updateProfile, getSetupStatus)
- Errors: `CoachNotFoundError`, `CoachAlreadyExistsError`, `CoachSlugConflictError`, `CoachNotActiveError`
- Helpers: `resolveCoachSlug` (same pattern as `resolvePlaceSlug`)

**`src/lib/modules/coach-setup/`** — Setup Status
- Use case: `getCoachSetupStatus` computes: hasCoachProfile, hasCoachSports, hasCoachLocation, hasCoachSchedule, hasCoachPricing, hasPaymentMethod, hasVerification, isSetupComplete, nextStep

**`src/lib/modules/coach-hours/`** — Schedule
- Repository + router: `coachHours.set`, `coachHours.get` (same pattern as court-hours)

**`src/lib/modules/coach-block/`** — Ad-hoc Blocks
- Repository + router: `coachBlock.create`, `coachBlock.delete`, `coachBlock.list` (same pattern as court-block)

**`src/lib/modules/coach-rate-rule/`** — Pricing
- Repository + router: `coachRateRule.set`, `coachRateRule.get` (same pattern as court-rate-rule)

**`src/lib/modules/coach-addon/`** — Add-ons
- Repository + router: `coachAddon.set`, `coachAddon.get` (same pattern as court-addon)

**`src/lib/modules/coach-availability/`** — Availability Calculation
- Service: `getAvailability(coachId, date)`, `getAvailabilityRange(coachId, startDate, endDate)`, `isCoachRangeAvailable(coachId, startTime, endTime)`, `computeCoachPricing(coachId, startTime, durationMinutes, selectedAddons)`
- Reads: coach_hours_window + coach_rate_rule - reservations (active, coachId) - coach_block
- Router: public procedures `coachAvailability.getForCoach`, `coachAvailability.getForCoachRange`

**`src/lib/modules/coach-venue/`** — Venue Attachment
- Service: `inviteCoach` (owner), `acceptInvitation`/`declineInvitation` (coach), `removeFromVenue` (either), `leaveVenue` (coach), `listByVenue`, `listMyVenues`
- Router: owner procedures (invite, remove, listByVenue) + coach procedures (accept, decline, leave, listMyVenues)
- Errors: `CoachVenueInvitationNotFoundError`, `CoachVenueAlreadyLinkedError`, `InvalidCoachVenueStatusError`

**`src/lib/modules/coach-review/`** — Reviews
- Repository + service + router: same pattern as `place-review`. One active review per user per coach. Public: list, aggregate. Protected: upsert, remove, viewerReview.

**`src/lib/modules/coach-payment/`** — Payment Methods
- Repository + service + router: same pattern as `organization-payment`. Coach-only CRUD. `getPaymentInfoForReservation` returns coach payment methods when reservation has coachId.

**Extend `src/lib/modules/reservation/`** — Coach Bookings
- Add `reservation-coach.service.ts`: `createForCoach`, `acceptReservation`, `rejectReservation`, `confirmPayment`, `cancelReservation`, `getForCoach`, `getReservationDetail`, `getPendingCount`
- Add `reservation-coach.router.ts` with coach-role procedures
- Add `reservation.createForCoach` to player-facing router
- Extend repository: `findOverlappingActiveByCoachId`, `findWithDetailsByCoach`, `findByCoachIdAndStatus`
- Booking flow: validate coach active → validate profile complete → validate time within hours → compute pricing → check availability (optimistic) → transaction (pessimistic lock, create reservation with coachId, log event, emit notification, create chat channel)
- Status lifecycle identical: CREATED → AWAITING_PAYMENT → PAYMENT_MARKED_BY_USER → CONFIRMED / EXPIRED / CANCELLED

**Extend `src/lib/modules/notification-delivery/`** — Coach Notifications
- Add templates: `coach_booking.created` (→coach), `coach_booking.accepted` (→player), `coach_booking.rejected` (→player), `coach_booking.payment_marked` (→coach), `coach_booking.confirmed` (→player), `coach_booking.cancelled_by_player` (→coach), `coach_booking.cancelled_by_coach` (→player), `coach_booking.expired` (→player), `coach_booking.pinged` (→coach)
- Each template: email subject/body, push title/body, in-app message with coach name, session date/time, sport
- Wire dispatch into coach reservation service status transitions

**Extend `src/lib/modules/chat/`** — Coach Booking Chat
- Add `createCoachReservationChannel(reservationId, coachUserId, playerUserId)` — GetStream channel `coach-reservation-{reservationId}`
- Wire into coach reservation creation + system messages on status transitions

### Frontend

**`src/features/coach-discovery/`** — Public Coach Explore + Detail + Booking

Pages:
- `pages/coaches-page.tsx` — route entry for `/coaches`
- `pages/coach-detail-page.tsx` — server component for `/coaches/{id}`
- `pages/coach-booking-page.tsx` — booking flow for `/coaches/{id}/book`

Components:
- `components/coaches-page-client.tsx` — main client wrapper with Suspense
- `components/coach-filters.tsx` — filter UI (sport, location, price range, rating, skill level, age group, session type, verified)
- `components/discovery-coach-card.tsx` — card: photo, name, tagline, sport badges, rating, base price, city
- `components/coach-detail/` — hero, about, qualifications, services, availability studio, reviews, contact, booking summary
- `server/public-coaches-discovery.tsx` — server resolver with `unstable_cache`

Hooks:
- `hooks/filters.ts` — `useModCoachDiscoveryFilters()` via nuqs
- `hooks/search.ts` — `useModCoachDiscoverySummaries()` via TanStack Query
- `hooks/availability.ts` — `useModCoachAvailability()`
- `hooks/coach-detail.ts` — `useModCoachDetail()`

Schemas: `schemas.ts` — nuqs URL params (view, q, province, city, sportId, minRate, maxRate, minRating, skillLevel, ageGroup, sessionType, verified, page, limit)

Location routing: `location-routing.ts` — `/coaches/locations/[province]/[city]/[sport]`

**`src/features/coach/`** — Coach Portal

Pages:
- `pages/coach-dashboard-page.tsx` — overview stats, pending bookings, upcoming sessions
- `pages/coach-get-started-page.tsx` — wraps setup wizard
- `pages/coach-schedule-page.tsx` — weekly hours + blocks
- `pages/coach-pricing-page.tsx` — rate rules + add-ons
- `pages/coach-reservations-page.tsx` — booking list with status filters
- `pages/coach-reservation-detail-page.tsx` — player info, actions (accept/reject/confirm/cancel), payment proof, timeline, chat
- `pages/coach-payment-methods-page.tsx` — payment method management
- `pages/coach-profile-page.tsx` — edit profile fields
- `pages/coach-settings-page.tsx` — notification preferences

Components:
- `components/get-started/wizard/coach-setup-wizard.tsx` — 8-step wizard (same pattern as owner wizard)
- `components/get-started/wizard/steps/` — profile-step, sports-step, location-step, schedule-step, pricing-step, payment-step, verify-step, complete-step
- `components/coach-schedule-editor.tsx` — weekly hours grid
- `components/coach-block-manager.tsx` — ad-hoc block CRUD
- `components/coach-pricing-editor.tsx` — rate rule editor
- `components/coach-addon-editor.tsx` — add-on management
- `components/coach-reservation-actions.tsx` — accept, reject, confirm payment, cancel buttons
- `components/coach-payment-methods-manager.tsx` — payment method CRUD
- `components/coach-reservation-chat-widget.tsx` — GetStream chat in reservation detail

### Routes

```
src/app/
├── (public)/coaches/
│   ├── page.tsx, loading.tsx, error.tsx        # Explore
│   ├── [id]/page.tsx                          # Detail
│   └── locations/[province]/[city]/[sport]/page.tsx
├── (auth)/coaches/[coachIdOrSlug]/book/
│   └── page.tsx                               # Booking
├── (coach)/coach/
│   ├── page.tsx                               # Dashboard
│   ├── layout.tsx                             # Portal shell + sidebar
│   ├── get-started/page.tsx                   # Setup wizard
│   ├── schedule/page.tsx
│   ├── pricing/page.tsx
│   ├── reservations/page.tsx
│   ├── reservations/[id]/page.tsx
│   ├── payment-methods/page.tsx
│   ├── profile/page.tsx
│   └── settings/page.tsx
```

### Reservation Detail Page Extension

The existing reservation detail page (`src/features/reservation/pages/reservation-detail-page.tsx`) must handle coach reservations: when `coachId` is set, show coach info (name, photo, sport) instead of court/venue info. Payment flow, status banner, countdown, chat — all reuse existing components.

## Spec Reference

Full design, research, and implementation plan: `.agents/planning/2026-03-14-coach-feature/`
- Design: `.agents/planning/2026-03-14-coach-feature/design/detailed-design.md`
- Implementation plan: `.agents/planning/2026-03-14-coach-feature/implementation/plan.md`
- Requirements Q&A: `.agents/planning/2026-03-14-coach-feature/idea-honing.md`
- Research (7 files): `.agents/planning/2026-03-14-coach-feature/research/`

## Acceptance Criteria

- **Given** `pnpm db:generate` and `pnpm db:migrate` run **Then** all 17 new tables + reservation modification applied cleanly
- **Given** `pnpm lint` runs **Then** zero errors
- **Given** a user creates a coach profile via the setup wizard at `/coach/get-started` **Then** all 8 steps complete, coach record created with all child entities
- **Given** a coach sets weekly hours, rate rules, and add-ons **Then** availability studio reflects correct open slots and pricing
- **Given** a coach creates an ad-hoc block **Then** blocked time slots no longer appear as available
- **Given** a player visits `/coaches` **Then** coach explore page renders with filters (sport, location, price, rating, skill level, age group, session type, verified)
- **Given** a player visits `/coaches/{slug}` **Then** coach detail page renders with profile, qualifications, availability, reviews, contact
- **Given** a player books a coach via `/coaches/{slug}/book` **Then** reservation created with `coachId` set and `courtId` null, status CREATED
- **Given** a coach accepts a booking in their portal **Then** reservation status transitions to AWAITING_PAYMENT, player notified
- **Given** a player marks payment and coach confirms **Then** reservation transitions PAYMENT_MARKED_BY_USER → CONFIRMED, both sides notified
- **Given** a booking expires (45 min timeout) **Then** reservation status transitions to EXPIRED, player notified
- **Given** a player leaves a coach review **Then** review stored, aggregate rating updated, one active review per user per coach enforced
- **Given** a venue owner invites a coach **Then** coach_venue record created with PENDING status; coach can accept/decline
- **Given** a coach booking is created **Then** GetStream chat channel created, system messages posted on status transitions
- **Given** coach portal at `/coach/` **Then** dashboard, reservations, schedule, pricing, profile, payment methods, settings pages all functional
- **Given** existing court reservations **Then** unaffected by schema migration (courtId still works, coachId null)

## Suggested Command

```bash
ralph run --config presets/pdd-to-code-assist.yml
```
