# Open Play User Flows

This document describes the intended MVP flows and UX behavior.

## Host flows

### A) Host creates Open Play during booking

1. Host selects a slot and creates a reservation.
2. Host enables "Host as Open Play" at checkout.
3. Host configures:
   - Max players
   - Join policy (Auto / Request)
   - Visibility (Public / Unlisted)
   - Note (optional)
   - Cost-sharing info (suggested split is shown; host adds payment instructions)
4. System creates an Open Play linked to the reservation.

After booking:
- The user continues the normal reservation flow (payment if required, otherwise reservation details).
- The Open Play is surfaced from Reservation Details (view/copy link, manage settings) without redirecting away from the reservation flow.

Visibility:
- Before the reservation is `CONFIRMED`, the Open Play is not visible/joinable to others.
- Once the reservation is `CONFIRMED`, the Open Play becomes visible (if `PUBLIC`) and joinable.

### B) Host converts an existing reservation

Preconditions:
- Reservation is owned by the host.
- Reservation is future-dated.
- Recommended: reservation is already `CONFIRMED`.

Flow:
1. Host opens reservation details.
2. Host clicks "Create Open Play".
3. Host configures the Open Play settings.
4. System creates (or reuses) the Open Play.
5. Host is redirected to Open Play detail.

Note:
- Prefer keeping the user on Reservation Details and surfacing Open Play there (avoid disrupting the reservation flow).

### C) Host shares Open Play

Host shares the Open Play detail URL.

Share targets:
- Direct friends (DM/SMS)
- Community chats (Messenger/WhatsApp)
- Public groups

The shared link should be safe:
- If reservation is not confirmed yet, non-host viewers see "not found" (no info leak).
- If unlisted, it should not appear in venue listings but the link works.

### D) Host moderates participants

For `REQUEST` sessions:
- Players appear as `REQUESTED`.
- Host can confirm, waitlist, or decline.

Paid session recommendation:
- Host confirms after payment is received off-app.

Capacity enforcement:
- Host cannot confirm beyond `maxPlayers`.

Waitlist management:
- If the session is full, joiners can become `WAITLISTED`.
- Host can promote a waitlisted player by confirming them when a spot is available.

### E) Host closes Open Play

- Host can close while the session is in the future.
- Closing prevents new joins and disables host moderation.

### F) Host cancels Open Play

- Host can cancel an Open Play while it's in the future.
- Cancelling is distinct from closing:
  - Close: stops new joins (session may still happen).
  - Cancel: session is cancelled (participants should not expect to play).

## Joiner flows

### A) Viewer discovers Open Plays at a venue

1. Viewer opens venue detail page.
2. Viewer switches to "Open Play" view.
3. Viewer sees a list of upcoming Open Plays.

List includes only sessions that are:
- `ACTIVE`
- `PUBLIC`
- in the future
- backed by a `CONFIRMED` reservation

### B) Viewer opens an Open Play detail page

Signed out:
- Can view public details.
- CTA prompts sign-in to join.

Signed in:
- Sees join/leave actions depending on status.

### C) Player joins

Preconditions:
- Reservation is `CONFIRMED`.
- Open Play is `ACTIVE`.
- Starts in the future.

Join request message:
- For `REQUEST` sessions, the player can optionally include a message to the host.

Outcomes:
- Auto-join + capacity: status becomes `CONFIRMED`.
- Request + capacity: status becomes `REQUESTED`.
- Full: status becomes `WAITLISTED`.

Started sessions:
- Once the Open Play has started, joining and host approvals are locked.

### D) Player leaves

- Player can leave at any time before end.
- If a confirmed player leaves, chat access should be removed.

## Chat flow

- Chat is available only to confirmed participants.
- If a participant is moved off `CONFIRMED` (leave, waitlist, decline), they lose chat access.

## Failure + edge-case expectations

- If Open Play creation fails after reservation creation:
  - Reservation remains valid.
  - UI should offer "Create Open Play" from reservation details.

- If reservation expires/cancels:
  - Open Play is not joinable.
  - Public detail becomes unavailable.
