# Gap Analysis

## Severity Definitions

| Level | Meaning |
|-------|---------|
| **P0 — Critical** | Directly blocks conversion, causes bookings to be missed, or breaks a core flow. |
| **P1 — Important** | Degrades the user experience or creates friction that leads to drop-off. |
| **P2 — Nice-to-Have** | Polish, efficiency, or future-proofing improvements. |

---

## Onboarding & Setup

### P0-01: No Notification Opt-In During or After Setup

The owner completes the full wizard, arrives at the dashboard, and is never prompted to enable notifications. If they do not independently discover the notification settings, they will never be alerted when a player books.

**Impact:** First booking goes unnoticed → no confirmation → automatic expiration → player churns.

**Recommendation:** Add a notification opt-in step to the wizard completion (or post-setup nudge). Prompt the owner to toggle notification preference ON and grant browser push permission in one combined flow.

---

### P0-02: No Team Invite Prompt After Setup

After setup, the owner manages everything alone. There is no suggestion to invite a manager or staff. Many venues have front-desk staff who should handle bookings.

**Impact:** Single point of failure. If the owner is unavailable, bookings expire unanswered.

**Recommendation:** Add a "Invite Your Team" prompt after setup completion — either as a wizard step or a dashboard nudge.

---

### P1-01: No Post-Wizard Guidance

After the completion screen, the user clicks "Go to Dashboard" and lands with no orientation. No walkthrough, no checklist, no "next steps."

**Impact:** First-session confusion. User may not know where key features are.

**Recommendation:** A lightweight post-setup checklist or tooltip tour: "Enable notifications," "Invite your team," "Share your booking link."

---

### P1-02: Claim Path Creates an Unresolvable Blocker

Choosing to claim an existing venue requires admin approval before courts can be added. No SLA is communicated. No way to unblock.

**Impact:** User abandonment during setup.

**Recommendation:** (a) Allow court setup while the claim is pending, or (b) clearly communicate expected approval time and notify when resolved. Offer "create new venue" as fallback.

---

### P1-03: Wizard Completion Has No Redirect

The "Complete" step requires a manual click to leave. No auto-redirect.

**Impact:** Minor friction. Users may linger or close the tab.

**Recommendation:** Auto-redirect to dashboard after a brief celebration (3–5 seconds) with a cancel option.

---

### P1-04: Skippable Steps Not Re-Surfaced

Schedule & Pricing, Payment, and Verification can be skipped. Once dismissed, there is no persistent reminder to complete them outside the Get Started hub.

**Impact:** Venue may go live without pricing (not bookable), without payment (cannot process), or without verification (not visible to players).

**Recommendation:** Dashboard banner or card for incomplete items. Consider blocking venue discoverability until minimum requirements are met.

---

### P2-01: Mock Functions in Secondary Features

Court photo upload/remove/reorder, organization slug check, and organization removal use placeholder logic that returns fake success.

**Impact:** Users see false positive feedback. Court photos do not persist.

**Recommendation:** Implement or remove the UI that triggers these.

---

### P2-02: No Step-Level Funnel Analytics

The wizard tracks step views but not skip vs. complete vs. abandon per step.

**Impact:** Cannot identify which step causes the most drop-off.

**Recommendation:** Add step-level events: started, completed, skipped, abandoned (with last step).

---

## Team Access & Permissions

### P0-03: Reservations Page Missing Permission Gate

The reservations page does not check the user's "View reservations" permission before rendering. Any member can access it by URL.

**Impact:** Perceived security issue. Backend still checks actions, but the page renders for unauthorized users.

**Recommendation:** Add permission gate requiring "View reservations."

---

### P0-04: Team Page Missing Permission Gate

The team page loads for all members including Viewers. The management UI inside blocks non-authorized users, but the page itself does not gate access — showing the shell before the error.

**Impact:** Inconsistent experience compared to other restricted pages.

**Recommendation:** Add permission gate at page level.

---

### P1-05: No Onboarding for Invited Team Members

Invited members land on the dashboard with no welcome screen, no role explanation, no notification prompt.

**Impact:** Members do not understand their capabilities and do not enable notifications.

**Recommendation:** First-login experience for invited members: show role, list capabilities, prompt notification enablement.

---

### P1-06: Viewer Role Overly Limited on Mobile

Viewers see only 3 tabs (Reservations, Courts, Profile) with no "More" menu. They cannot access Dashboard, Team, or Availability Studio from mobile.

**Impact:** Significant gap between desktop and mobile experience for Viewers.

**Recommendation:** Give Viewers a "More" menu with accessible pages (Dashboard, Team, Availability Studio).

---

### P1-07: No Audit Trail for Permission Changes

Role changes, permission toggles, and member revocations are not logged.

**Impact:** No accountability trail for team disputes or compliance.

**Recommendation:** Log permission change events with actor and timestamp.

---

### P2-03: No Bulk Team Invite

Members are invited one at a time. Tedious for venues with 5+ staff.

**Recommendation:** Support comma-separated email list or CSV for batch invitations.

---

## Notifications

### P0-05: Email Only Covers 2 of 8 Events

Only new bookings trigger email. Payment marked, confirmed, rejected, cancelled, and player ping use push/inbox only.

**Impact:** If push is not enabled (common on desktop), 6 of 8 events are only visible by opening the app.

**Recommendation:** Extend email to at least: payment marked, booking cancelled, player ping.

---

### P0-06: No Notification Prompt During Onboarding

(Same as P0-01 from the notification perspective.) Setup completes with notifications defaulting to OFF.

**Impact:** Venue is "live" but effectively deaf to bookings.

**Recommendation:** Integrate notification opt-in into the setup completion flow.

---

### P1-08: No Per-Channel Preferences

The notification preference is all-or-nothing. Users cannot say "email yes, push no."

**Impact:** Users who find push disruptive must disable all notifications entirely.

**Recommendation:** Per-channel toggles: inbox (always on), email, web push, mobile push, SMS.

---

### P1-09: Zero-Opted-In Warning Only in Settings

The warning that no members are receiving notifications only appears in the notification routing settings page.

**Impact:** The owner must navigate to settings to discover the problem.

**Recommendation:** Surface this warning on the dashboard or as a persistent banner.

---

### P1-10: Push Permission Is a Separate Manual Step

Toggling the notification preference ON does not trigger the browser push permission prompt. Two disconnected actions in different parts of the UI.

**Impact:** Users toggle the preference and assume they are set. They miss push notifications.

**Recommendation:** Combine into a single flow — when enabling notifications, prompt for push permission immediately.

---

### P2-04: No Quiet Hours

Notifications arrive at all hours. A 2 AM booking triggers an immediate push.

**Recommendation:** Optional quiet hours with deferred delivery.

---

### P2-05: No Expiration Notification

When a reservation auto-expires because the owner did not respond, no notification is sent.

**Impact:** No feedback loop to encourage faster response times.

**Recommendation:** Notify owner when a booking expires unreviewed.

---

## Reservation Lifecycle

### P1-11: Player Receives No Email for Confirmations/Rejections

When an owner confirms or rejects a booking, the player is only notified via push and inbox — no email.

**Impact:** If the player does not have push enabled or is not checking the app, they may not know their booking was confirmed or rejected until they show up (or do not).

**Recommendation:** Send email for all status changes that affect the player: confirmed, rejected, cancelled.

---

### P1-12: No Guided Recovery From Failed Verification

If verification is rejected, the owner sees "REJECTED" with no explanation.

**Impact:** Dead end. Owner cannot fix the issue without contacting support.

**Recommendation:** Include rejection reason (set by admin) and clear resubmission instructions.

---

## Discovery & Booking

### P1-13: No Clarity on Venue Discoverability

It is unclear to the owner when their venue becomes visible in search, whether incomplete items affect discoverability, or what players see.

**Impact:** Owners may think they are live when they are not, or may not realize missing pricing means courts are not bookable.

**Recommendation:** "Venue Status" indicator on dashboard showing visibility state and what is blocking it.

---

### P1-14: The "Go Live" Moment Is Silent

When all requirements are met, the venue becomes bookable with no celebration, no confirmation email, no dashboard change, no sharing prompt.

**Impact:** Missed milestone moment. No organic social sharing opportunity.

**Recommendation:** "Your venue is live!" moment: email, banner, shareable booking link with preview.

---

## Payments

### P1-15: No Automated Payment Verification

Every payment proof must be manually verified by the owner. No integration with bank APIs or wallet APIs.

**Impact:** Slow confirmation turnaround. Scales poorly for busy venues.

**Recommendation:** Future opportunity for GCash API / bank API integration. Low priority for market entry but important for scale.

---

## Chat

### P2-06: No Push Notification for New Chat Messages

New chat messages do not trigger push or email notifications. Users must have the app open.

**Impact:** Messages may be missed, delaying coordination.

**Recommendation:** Trigger push notification for new chat messages in active reservation threads.

---

## Admin

### P1-16: No SLA Tracking for Claims and Verifications

No visibility into how long claims or verifications have been pending. No escalation alerts.

**Impact:** Aging claims block owner onboarding. No accountability for review speed.

**Recommendation:** Add aging indicators, escalation alerts, and average review time metrics to admin dashboard.

---

## Accounts

### P2-07: No Saved Venues or Favorites

Players cannot bookmark venues for quick access later.

**Recommendation:** Add a favorites/saved venues feature for returning players.

---

### P2-08: No Booking History Export

Players cannot download their reservation history.

**Recommendation:** CSV or PDF export of booking history for personal records.

---

## Summary: Priority Distribution

| Severity | Count | Key Theme |
|----------|:-----:|-----------|
| **P0** | 6 | Notification blindness, missing permission gates |
| **P1** | 16 | Onboarding friction, email coverage gaps, UX consistency |
| **P2** | 8 | Polish, convenience features, future scalability |
