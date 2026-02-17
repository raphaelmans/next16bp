# Open Play Cost Sharing (MVP)

Open Play is commonly used so players can share the reservation cost.

## Principles

- The reservation is paid to the venue/owner. That flow stays unchanged.
- Cost sharing is player-to-host reimbursement.
- KudosCourts does not process payments and does not verify off-platform transfers.

This model aligns with existing reservation payment disclaimers and with Reclub's approach (off-platform payment + in-app coordination).

Reference:
- Reclub payments overview: https://help.reclub.co/hc/reclub-help/articles/1765845748-how-do-payments-work-in-recub

## What we show

### Reservation total

Always show the reservation total as the base amount:
- Amount: `reservation.total_price_cents`
- Currency: `reservation.currency`

### Suggested split (per player)

Suggested split should consider headcount and be predictable.

Decision:
- Split basis: `openPlay.maxPlayers` (includes host).

Formula:
- `perPlayer = reservationTotal / maxPlayers`

Rounding policy (recommended):
- Round up to the nearest peso centavo when displaying.
- If `reservationTotal` does not divide evenly, show:
  - "Estimated" per-player amount, and
  - "Host covers any remainder" (or allow host to override via note).

Examples:
- PHP 1200 total, maxPlayers 4 => PHP 300/player
- PHP 999 total, maxPlayers 4 => PHP 249.75/player (display as PHP 250 estimated)

### Payment instructions (host-provided)

Host can provide:
- How to pay: GCash / bank transfer / cash at venue
- Where to send: handle/account
- Deadline: e.g., "Pay within 30 mins to secure your spot"
- Optional link: e.g., payment link or a shortlink

## Recommended join policy for paid sessions

If reimbursement is expected:
- Paid sessions use `REQUEST` join policy (host approval required).
- Host confirms participants after payment is received off-platform.

This keeps the RSVP state machine simple:
- `CONFIRMED` implies "approved/paid".

## Safety + trust messaging (recommended)

Short version (UI-ready):
- "KudosCourts does not process payments. Pay the host directly using the instructions below."
- "Only send payment to accounts you trust."

Longer version (help center-ready):
- Payments happen off-platform between players and the host.
- KudosCourts is not a payment processor, escrow agent, or financial institution.
- Payment disputes are between players and the host.

## Future (non-MVP)

If we later want a stronger Reclub-like workflow:
- Add receipt upload per participant.
- Add host verification and a "Paid" indicator.
- Optionally gate `CONFIRMED` on verification.
