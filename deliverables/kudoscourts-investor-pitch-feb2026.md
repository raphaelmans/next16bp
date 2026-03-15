# KudosCourts

**Player-first court discovery & reservations for sports venues.**

February 2026

---

## Vision

KudosCourts is a court discovery platform for players and a free reservation system for sports venues in the Philippines.

- **For players:** Find the right court, see real availability, and reserve time — without DMs, calls, or guesswork.
- **For venues:** List for free, set hours and rates, and manage reservations with lightweight ops tools.
- **For the platform:** No payment processing liability. Verified owners and in-app chat to coordinate bookings clearly.

---

## Problem

### For Players

- **Discovery is fragmented.** Courts are scattered across Facebook pages, Viber groups, screenshots, and outdated pins. There's no single place to search.
- **Availability is unclear.** "Is this court open?" requires messaging or calling — and the answer is often delayed or wrong.
- **Booking is inconsistent.** Every venue has a different process, different rules, and different payment expectations.

### For Venue Owners

- **Scheduling is manual.** Spreadsheets, DMs, and phone calls lead to errors and double-booking.
- **Rates and policies are hard to communicate.** Pricing changes, peak-hour rules, and cancellation policies get lost in chat threads.
- **"Going digital" is expensive.** Custom software or generic booking tools don't fit the local market and cost too much for small operators.

---

## Solution

A single platform that connects discovery to bookable inventory.

- **Public discovery layer** — Places, courts, sport filters, location filters, amenities, and real-time schedule views.
- **Standardized reservation engine** — Timeboxed booking requests, clear status lifecycle, and an owner confirmation loop.
- **Curated-to-bookable pipeline** — Seed inventory through curation, then convert venues through claiming and ownership verification.
- **Owner ops tools** — Hours configuration, pricing rules, Availability Studio, AI-powered booking imports, in-app chat, and a reservations inbox for fast triage.

---

## Product Model

### Core Entities

- **Place** — A venue or listing (address, map pin, photos, amenities). Can contain multiple courts.
- **Court** — A bookable unit inside a place. One court = one sport.
- **TimeSlot** — 60-minute inventory rows per court. Duration is built from consecutive slots (60/120/180+ minutes).
- **Reservation** — A booking request that follows a mutual-confirmation contract with clear status lifecycle.

### Bookability Gates

Not every listing is immediately bookable. Supply quality is controlled through a staged pipeline:

**Curated** (discoverable, read-only) → **Claimed** (owner request, admin review) → **Verified** (ownership confirmed) → **Bookable** (reservations enabled)

This prevents low-trust bookings and ensures players have a reliable experience from day one.

---

## Player Journey

1. **Discover** — Search by sport, location, and amenities. Browse map or list view.
2. **Select** — Open a place detail page. Choose a specific court or "any available" (lowest-price option).
3. **Book** — Pick duration and start time. Submit a booking request.
4. **Pay (P2P)** — Receive the venue's payment instructions (GCash, Maya, bank, cash). Mark payment in-app.
5. **Confirmed** — Owner verifies payment and confirms the booking. Both parties have a clear record.

The platform does not process payments. Players pay venues directly. This eliminates payment processing liability and keeps the system lightweight for operators.

---

## Owner Journey

### Onboarding (4 steps)

1. **Create organization** — Name, logo, profile. Manage multiple venues under one account.
2. **Add or claim venue** — Create a new listing or claim an existing curated one.
3. **Get verified** — Submit ownership proof (phone, social links, documents). Admin reviews and approves.
4. **Configure courts & go live** — Set hours, pricing, amenities. Publish availability. Players can book immediately.

### Daily Operations

- **Availability Studio** — A visual block editor for managing schedules. Five color-coded block types: available (green), maintenance (gray), walk-in holds (light orange), guest bookings (medium orange), and platform bookings (strong orange). Desktop week view, mobile day view.
- **Reservations Inbox** — Tabbed view (Pending, Upcoming, Past, Cancelled) with fast accept/reject/confirm actions. Pending sub-filters: needs acceptance, awaiting payment, payment marked. Real-time polling for new bookings.
- **Payment Confirmation** — Owner confirms P2P payments (GCash, Maya, bank transfer). Supports payment proof uploads and offline confirmation.
- **In-App Chat** — Real-time messaging per reservation via Stream Chat. Coordinate details without leaving the platform.
- **Push Notifications** — Instant alerts for new bookings, payment updates, and actions needed. Email, web push, and mobile push channels.

### Power Features

- **AI-Powered Booking Imports** — Migrate existing bookings from CSV, Excel, iCal, or screenshots. AI normalizes and maps data automatically. Review row-by-row before committing.
- **Open Play Hosting** — Venue owners can support player-hosted pickup games at their courts.
- **Mobile App** — Full management on the go. Mobile beta launching next week for better notification reliability and booking management.

---

## Open Play

Players can host pickup games at any venue on the platform.

- **Session creation** — Attach a game to an existing reservation. Set player caps and cost-sharing details.
- **Join requests** — Auto-accept or manual approval. Participant management with status tracking.
- **Visibility control** — Public (discoverable) or unlisted (invite-only via share link).
- **Payment sharing** — Hosts set payment instructions for participants to split costs.

Open Play creates recurring demand for venues and gives players more reasons to return to the platform.

---

## Trust, Safety & Quality Control

### Staged Supply Pipeline

Supply quality is enforced at every step:

1. **Curated places** — Discoverable and read-only. Contact info visible, not bookable. Immediate removal on request.
2. **Claiming** — Owners submit claim requests through an admin-reviewed workflow with chat support for clarifications.
3. **Ownership verification** — We validate phone, social links, and documents to prevent fake owners. Admin-reviewed with audit trail.
4. **Booking gate** — Reservations enabled only after verification and owner enablement. Server-enforced — unverified places cannot be booked.

### Privacy & Enforcement

- Payment account details never exposed via public endpoints — shown only in the reservation payment context.
- Audit trails on all reservation and claim status transitions.
- Role-based access control across player, owner, and admin portals.

### Liability Posture

- No in-app payment processing — zero financial liability.
- Clear expectations via reservation status lifecycle + audit trail.
- In-app chat (Stream Chat) replaces unstructured DMs with a coordinated channel tied to each booking.

---

## Go-To-Market

### Strategy: Supply-First

1. **Curate** — Seed venue listings in target cities (discoverable, read-only).
2. **Drive demand** — Players use discovery, creating organic pull for venues.
3. **Outreach** — Contact venues: "Claim your listing and get bookable."
4. **Convert** — Claim → verify → enable reservations. Each conversion improves the discovery experience.

### Early Adopter Program

- **5 partners per city** — Limited to build exclusivity and focus.
- **6 months of Business Plus free** — Automatically included when the premium tier launches.
- **3 months of featured placement** — Top visibility in city search rankings, then transition to paid featuring.
- **Dedicated hands-on support** — We work closely with early partners to ensure reliability, gather real-world feedback, and improve the experience together. This feedback loop is critical for hardening the platform before broader rollout.

### Channels

- Local club partnerships, tournaments, and community groups.
- **SEO & AI search visibility:** Every province and city gets a dedicated discovery page optimized for searches like "basketball courts in Makati" or "badminton near Cebu." These pages rank on Google and surface in AI assistants — driving organic player traffic directly to listed venues.
- Direct venue outreach: "Claim your place" and "Get bookable" campaigns.
- Public venue pages designed for social sharing and AI agent discoverability.

SEO and AI discoverability is also a key owner benefit — venues gain search visibility they couldn't build on their own.

---

## Business Model

### Free Tier

The essentials at no cost: discovery listing, court management, availability studio, reservation inbox, guest profiles, P2P payment coordination, and verified badge.

Beta features (booking imports, limited chat, push notifications, mobile app) are available during early access — their long-term inclusion and scope will be shaped by usage data and the Business Plus tier.

This removes the adoption barrier entirely. Venues have no reason not to join.

### Business Plus (subscription)

Premium tools for venues that want more operational depth:

- Analytics dashboards (occupancy rates, revenue trends, booking patterns)
- Unlimited in-app chat (no message limits, enhanced coordination)
- SEO & AI search visibility (rank for "courts in [city]" queries)
- Integrations (connect with external tools and channels)
- Multi-user staff access
- Data retention and exports

Pricing TBD. Shaped with early partners before public launch.

### Featured Placements

Venues pay for city-level search prominence after the 3-month free early adopter period. Featured ads by city first (organic UX integration), generic ad spaces later (primarily mobile header to preserve web experience).

### Future: Payment Processing

Today, reservation coordination is manual — venues collect payments externally (GCash, Maya, bank, cash). The next major unlock is integrated payment processing for automated booking + confirmation, with a **payment processing fee** as an additional revenue stream.

### Future: Coach Ecosystem

Feature coaches on the platform — profiles, lesson scheduling, and booking. Potential revenue through coach subscriptions or lead fees.

### Partnerships

Sports brands, equipment companies, media affiliates, and tournament organizers.

---

## Platform Maturity & Tech

This is not a prototype. The platform is built, functional, and preparing for controlled launch.

### Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript (strict)
- **API:** tRPC + TanStack Query
- **Database:** Drizzle ORM + PostgreSQL (Supabase)
- **Auth:** Supabase Auth (magic link + email OTP)
- **Storage:** Supabase Storage (photos, documents, payment proofs)
- **Chat:** Stream Chat (GetStream) — real-time messaging per reservation
- **Notifications:** Email (Resend), web push (Service Workers), mobile push (Expo)
- **Mobile API:** 82 endpoints serving the mobile app (owner + player)
- **AI:** OpenAI integration for booking import normalization (CSV/XLSX/ICS/screenshot → structured data)
- **Rate Limiting:** Upstash (Redis)
- **Analytics:** Mixpanel + Vercel Analytics

### What's Shipped

| Feature | Status |
|---------|--------|
| Player discovery (map, list, filters) | Shipped |
| Court detail + schedule views | Shipped |
| Booking flow (free + paid courts) | Shipped |
| Owner onboarding (org → venue → verify → courts) | Shipped |
| Availability Studio (visual block editor) | Shipped |
| Reservations inbox (accept/reject/confirm) | Shipped |
| P2P payment confirmation | Shipped |
| Place claiming workflow | Shipped |
| Ownership verification workflow | Shipped |
| AI-powered booking imports | Shipped |
| Open Play (pickup games) | Shipped |
| In-app chat (Stream Chat) | Shipped |
| Push notifications (email + web + mobile) | Shipped |
| Mobile API (82 endpoints) | Shipped |
| Admin portal (curation, claims, verification) | Shipped |
| Mobile app | Beta next week |

---

## Traction & Metrics

[TBD — Pre-launch. Metrics to track:]

- Venues onboarded (curated → claimed → verified → live)
- Reservation completion rate
- Search → detail conversion
- Detail → booking start conversion
- Player monthly active bookers
- Claim approval rate and time-to-live

---

## Roadmap

### Phase 1: Foundation (Now → Next Month)

- Reservation reliability hardening (prevent double-booking edge cases, audit trail completeness)
- Notification reliability (mobile beta launch for push notifications)
- Owner onboarding polish (faster setup, clearer prompts)
- Email notifications as the baseline reliable channel

### Phase 2: Controlled Growth

- Early adopter partner onboarding (5 per city, hands-on support)
- Public venue pages for SEO and AI search visibility (province/city discovery pages ranking for "[sport] courts in [city]" queries)
- Mobile app v1 distribution (APK / TestFlight)
- Player onboarding improvements (loading speed, frictionless reserve flow)

### Phase 3: Monetize & Expand

- Business Plus subscription launch (analytics, integrations, staff roles)
- Featured placements (paid, per-city)
- Payment processing integration (automated booking + confirmation, processing fees)
- Coach ecosystem (profiles, lesson scheduling, lead fees)
- Open Play and tournament capabilities (recurring demand drivers)

---

## The Ask

[TBD]

- **Pilot venues** — Design partners in target cities to validate the early adopter program.
- **Distribution partners** — Clubs, communities, tournament organizers, and sports media to drive player adoption.
- **Capital and/or team support** — [TBD if fundraising: amount, use of funds, timeline].
