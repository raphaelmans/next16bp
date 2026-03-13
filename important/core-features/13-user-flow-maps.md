# User Flow Maps (Appendix)

_Appendix for the guide-aligned core-features doc set. These flow maps stay implementation-focused and support the primary narrative in [00-overview.md](./00-overview.md)._

## Flow 1: Player Books a Court (Happy Path)

The primary conversion path from the player's perspective.

```
[1] Player visits KudosCourts (landing page or direct link)
 │
 ▼
[2] Browses courts (search, filter by location/sport/amenities, map view)
 │
 ▼
[3] Views venue detail page (photos, verified badge, court list, contact info)
 │
 ▼
[4] Checks court schedule (weekly calendar, available slots highlighted)
 │   → Can extend selection across midnight/week boundary when hourly slots are contiguous
 │
 ▼
[5] Selects a time slot
 │   → Profile check: must have name, email, phone. Prompted if incomplete.
 │   → Optionally adds add-ons (shoe rental, ball rental, etc.)
 │   → Optionally adds more courts (group booking)
 │
 ▼
[6] Confirms booking → Reservation CREATED
 │
 ▼
[7] Waits for owner to accept
 │   → Receives push/inbox notification when accepted
 │
 ▼
[8] Sees payment instructions (owner's bank/wallet details, countdown timer)
 │   → Transfers money externally (GCash, bank app, etc.)
 │   → Uploads proof (reference number, screenshot)
 │   → Clicks "I Have Paid" → Reservation PAYMENT_MARKED_BY_USER
 │
 ▼
[9] Owner verifies payment → Reservation CONFIRMED
 │   → Player receives push/inbox notification
 │
 ▼
[10] Player plays on scheduled date → Reservation remains CONFIRMED and later appears in Past tab by end-time cutoff
```

### Drop-Off Points

| Stage | Risk | Severity |
|-------|------|----------|
| 2 → 3 | Venue not verified or no pricing → cannot book | Medium |
| 5 → 6 | Incomplete profile blocks booking | Low (prompted) |
| 7 | Owner does not respond → reservation expires | High |
| 8 | Payment timer expires before player pays | Medium |
| 9 | Owner does not confirm payment promptly | Medium |

---

## Flow 2: Venue Owner Conversion Funnel

From signup to receiving the first booking.

```
[1] Owner signs up (dedicated owner registration path)
 │
 ▼
[2] Enters setup wizard (redirected if no organization)
 │
 ▼
[3] Creates organization (name + slug)
 │
 ├── Path A: Add New Venue ────────────────────┐
 │   (form: name, address, amenities)          │
 │   Venue created immediately                 │
 │                                             │
 ├── Path B: Claim Existing Venue ────────┐    │
 │   Search → submit claim                │    │
 │   ⚠ BLOCKED: wait for admin approval   │    │
 │                                        │    │
 ▼                                        ▼    ▼
[4] Add courts (sport, label)
 │
 ▼
[5] Configure schedule & pricing (SKIPPABLE)
 │
 ▼
[6] Add payment method (SKIPPABLE)
 │
 ▼
[7] Submit venue verification (SKIPPABLE, async admin review)
 │
 ▼
[8] Wizard complete screen
 │   ⚠ NO in-wizard notification activation step
 │   ⚠ NO team invite prompt
 │   ⚠ Dashboard warnings exist later, but setup completion itself is still silent
 │
 ▼
[9] Owner lands on dashboard
 │   → Setup and notification routing warnings can appear here
 │
 ▼
[10] Venue becomes visible to players (once verified + configured)
 │
 ▼
[11] First booking arrives
 │
 ▼
[12] Owner receives notification?
     ├── IF notifications enabled: Yes → reviews → confirms → SUCCESS
     └── IF not enabled: No alert → booking expires → FAILURE
```

### Drop-Off Points

| Stage | Risk | Severity |
|-------|------|----------|
| 3 → 4 (Claim path) | Admin delay blocks progress, no ETA | High |
| 5 (Schedule) | Complex UI, user skips and forgets | Medium |
| 7 (Verification) | Async approval, user may not return | Medium |
| 8 → 9 (Post-wizard) | No in-wizard handoff for notifications/team; relies on later dashboard follow-up | Critical |
| 11 → 12 (First booking) | Notifications off → booking missed | Critical |

---

## Flow 3: Team Member Onboarding

How a staff member joins and becomes operational.

```
[1] Owner navigates to Team page
 │
 ▼
[2] Invites member (email, role, permissions)
 │
 ▼
[3] Invitation email sent (org name, role, permissions, CTA button)
 │   Expires in 7 days
 │
 ▼
[4] Invitee receives email
 │
 ├── New user: must register first (email must match) ───┐
 ├── Existing user: logs in ─────────────────────────────┤
 │                                                       │
 ▼                                                       ▼
[5] Enters invitation code from email → Accept or Decline
 │
 ├── Decline → flow ends
 │
 ▼
[6] Accepted → immediately has access with assigned role
 │
 ▼
[7] Lands on owner dashboard
 │   ⚠ NO welcome screen
 │   ⚠ NO role/permissions explanation
 │   ⚠ NO notification prompt
 │
 ▼
[8] Must independently:
    a. Find notification settings
    b. Toggle reservation notifications ON
    c. Grant browser push permission (separate step)
```

### Drop-Off Points

| Stage | Risk | Severity |
|-------|------|----------|
| 3 → 4 | Email goes to spam, no resend UI | Medium |
| 4 → 5 | New user must register first — extra friction | Medium |
| 7 (Post-accept) | No onboarding, does not know what to do | High |
| 8 (Notifications) | Multi-step, most members will not complete | Critical |

---

## Flow 4: Notification Activation

How a member goes from "no alerts" to "fully receiving notifications."

```
[1] Member is on the dashboard
 │
 ▼
[2] May see dashboard warning if zero recipients are enabled; otherwise must find notification settings manually
 │
 ▼
[3] Toggle "Receive reservation notifications" → ON
 │   ⚠ Push permission still requires a separate browser permission step
 │
 ▼
[4] Navigate to web push settings (different location)
 │
 ▼
[5] Click "Enable Push Notifications"
 │   Browser permission prompt appears
 │
 ├── Grants → push enabled → FULLY ACTIVATED
 ├── Denies → push permanently blocked in that browser
 └── Dismisses → can retry later
```

### Drop-Off Points

| Stage | Risk | Severity |
|-------|------|----------|
| 1 → 2 | Warning is conditional; many users still must know where to look | Critical |
| 3 → 4 | Two disconnected steps — user assumes step 3 is enough | High |
| 5 | Browser deny = permanent block, no recovery guidance | Medium |

---

## Flow 5: Reservation Lifecycle (Owner Side)

What the owner experiences from booking to completion.

```
[1] Player submits booking request
 │
 ▼
[2] Notification delivered to opted-in members
 │   → Inbox badge updates
 │   → Push notification (if enabled)
 │   → Email with details (new bookings only)
 │
 ▼
[3] Owner opens reservation list (Inbox/Pending tab)
 │   → Reviews: player name, court, date, time, amount
 │
 ├── Accept → AWAITING_PAYMENT → player notified (push/inbox only)
 ├── Reject → CANCELLED → player notified (push/inbox only, no email)
 └── No action → EXPIRED (no notification to owner)
 │
 ▼ (if accepted)
[4] Player pays externally and uploads proof
 │   → Owner notified: "Payment marked" (push/inbox, no email)
 │
 ▼
[5] Owner reviews proof (reference number, screenshot)
 │
 ├── Confirm payment → CONFIRMED → player notified (push/inbox, no email)
 ├── Mark as paid offline → CONFIRMED (for cash/walk-in)
 └── Reject → CANCELLED
 │
 ▼
[6] Play date arrives → reservation remains CONFIRMED; UI classification moves it to Past by end time
```

---

## Flow 6: Open Play (Social Booking)

How players organize group sessions.

```
[1] Player has a court reservation (or creates a standalone session)
 │
 ▼
[2] Converts to Open Play session
 │   → Sets available spots, suggested cost split
 │
 ▼
[3] Session appears on Open Play listing page
 │
 ▼
[4] Other players browse Open Play listings
 │   → See: sport, date, time, spots, cost, organizer
 │
 ▼
[5] Player requests to join
 │
 ▼
[6] Organizer approves or declines
 │
 ▼
[7] Approved players join the session
 │   → Group chat available for coordination
 │   → Participants can leave voluntarily
 │
 ▼
[8] Session date arrives → everyone plays
```

---

## Critical Path Summary

The most impactful gaps cluster around **transitions between features**:

| Transition | Gap |
|-----------|-----|
| **Onboarding → Notifications** | No in-wizard bridge. Activation is still outside setup completion. |
| **Team Invite → Member Activation** | No bridge. Invited members have no onboarding and no notification prompt. |
| **Booking → Owner Response** | Email only covers new bookings. Expiration has no alert. |
| **Setup → Discoverability** | No visibility into when the venue goes live or what blocks it. |
| **Confirmation → Player** | Player receives no email for confirmations or rejections. |

These transitions are where conversion is lost. Each one is a moment where the user completed a step but was not guided to the next action that makes the platform valuable.
