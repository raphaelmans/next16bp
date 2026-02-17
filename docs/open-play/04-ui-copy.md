# Open Play UI Copy Spec

Voice:
- Friendly, not playful
- Professional, not corporate
- Clear and specific (avoid buzzwords)

Design notes:
- Follow KudosCourts "Minimalist Bento" patterns (cards, warm neutrals, subtle depth).
- Keep primary CTAs teal; use orange for links/secondary highlights; red for destructive.

## 1) Venue detail toggle

Toggle labels:
- "Book"
- "Open Play"

Empty state:
- Title: "No Open Plays yet"
- Body: "Be the first to host an Open Play at this venue."
- CTA: "Host an Open Play"

Helper (when Open Play view is active):
- "Host an Open Play by booking a time slot, then marking it as Open Play at checkout."

## 2) Open Play list card

Default title:
- "Open Play" (fallback when host did not set a title)

Badges:
- Join policy: "Auto-join" or "Request"
- Spots:
  - Full: "Full"
  - Otherwise: "{N} spot(s) left"

Optional cost-sharing badge (if present):
- "Est. {currency} {amount}/player"

Subtitle line:
- "{sport} • {court}"

Host label:
- Display host name (truncate)

## 3) Open Play detail page

Header:
- Title: host-set title or "Open Play"
- Subheader: "{sport} • {court} • {venue}"

Time:
- "{Day Mon D} · {timeStart}-{timeEnd}"

Capacity block:
- "{availableSpots} spot(s) left" or "Full"
- "{confirmedCount} confirmed"
- "{maxPlayers} total"

Host section:
- Name + "Host"

Note section label (if present):
- No label; render as a bordered note block

Auth prompts:
- Signed out:
  - Body (Auto-join): "Sign in to join and access chat."
  - Body (Request): "Sign in to request to join and access chat."
  - CTA: "Sign in"

Join actions:
- Not joined:
  - Helper (Auto-join): "Join this Open Play."
  - CTA (Auto-join): "Join"
  - Helper (Request): "Request to join this Open Play."
  - CTA (Request): "Request to join"
  - Dialog (Request):
    - Title: "Request to join"
    - Field label: "Message to host (optional)"
    - Placeholder: "e.g. Can bring extra balls"
    - CTA: "Send request"
- Requested:
  - "Status: REQUESTED"
  - CTA: "Leave"
- Waitlisted:
  - "Status: WAITLISTED"
  - CTA: "Leave"
- Confirmed:
  - "Status: CONFIRMED"
  - CTA: "Leave"

Close action (host):
- Helper: "You are hosting this Open Play."
- CTA: "Close"

Cancel action (host):
- CTA: "Cancel"
- Confirm dialog:
  - Title: "Cancel Open Play"
  - Description: "This will cancel the Open Play and prevent anyone from joining."
  - Confirm CTA: "Cancel Open Play"

Started/locked banner:
- "This Open Play has already started. Joining and approvals are locked."

## 4) Cost sharing section (Open Play detail)

Section title:
- "Cost sharing"

Recommended layout:
- Line 1: "Reservation total" -> "{currency} {total}"
- Line 2: "Suggested split" -> "Est. {currency} {perPlayer}/player (based on {maxPlayers} players)"
- Optional block: "How to pay" -> host-provided instructions + copy button

Disclaimer microcopy:
- "KudosCourts does not process payments. Pay the host directly using the instructions above."

## 5) Checkout: "Host as Open Play"

Card title:
- "Open Play"

Switch label:
- "Host as Open Play"

Switch helper:
- "Create a joinable session for other players after your reservation is confirmed."

Fields:
- "Max players" helper: "Includes you as the host."
- "Join policy" options:
  - "Request (Host approves)"
  - "Auto-join (If spots)"
  - Note for paid sessions: "Paid sessions require host approval." (Auto-join disabled)
- "Visibility" options:
  - "Public"
  - "Unlisted (Link only)"
- "Note (optional)" placeholder:
  - "e.g. Beginner-friendly, bring extra balls"

Cost-sharing fields (recommended copy):
- Label: "Reservation total"
- Label: "Suggested split"
- Label: "Payment instructions (optional)"
  - Placeholder: "e.g. GCash to 09xx..., send screenshot in chat"

## 6) Reservation detail: Create Open Play dialog

Button labels:
- "Create Open Play"
- "View Open Play"

Helper under create button:
- "Open Plays become visible to others only after your reservation is confirmed."

Dialog title:
- "Create Open Play"

Fields match checkout + cost-sharing fields.

## 7) Share block

Card title:
- "Share"

Button:
- "Copy link"

Optional helper (small text):
- "Share this link to invite friends to join."

## 8) Error messages

Keep errors user-actionable:
- Not found: "Open Play not found."
- Not confirmed yet (public): treat as not found.
- Closed: "This Open Play is closed."
- Past start: "This Open Play has already started."
- Full: "This Open Play is full."
- Join own: "You can't join your own Open Play."
