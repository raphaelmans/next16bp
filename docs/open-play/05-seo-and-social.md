# Open Play SEO + Social Toolkit

This covers page metadata and share-friendly copy patterns.

## SEO targets

Primary intents:
- "open play {sport} near me"
- "pickleball open play {city}"
- "{venue} open play"
- "join pickleball game {city}"

## Indexable pages

- Open Play list for a venue/place:
  - `/places/[placeId]/open-play`
- Open Play detail:
  - `/open-play/[openPlayId]`

Gating:
- Only allow public detail content when the underlying reservation is `CONFIRMED`.
- Before confirmation, return 404 (avoid indexing leaks).

## Title + meta description templates

### Venue list

Title:
- "Open Play at {VenueName} | KudosCourts"

Description:
- "Browse upcoming Open Play sessions at {VenueName}. Join a game, meet players, and reserve your spot."

### Open Play detail

Title:
- "Open Play: {Sport} at {VenueName} ({Day} {Time}) | KudosCourts"

Description:
- "Join an Open Play at {VenueName}. {SpotsLeft} spots left. RSVP to play with others and coordinate in group chat."

If cost sharing is set:
- Append: "Suggested split: {Currency} {PerPlayer}/player."

## Open Graph / social previews

OG title:
- "Open Play at {VenueName}"

OG description:
- "{Sport} • {CourtLabel} • {Day} {Time}. {SpotsLeft} spots left."

Optional (if cost-sharing exists):
- "Suggested split: {Currency} {PerPlayer}/player."

OG image direction (design system):
- Minimalist bento card with teal accent, warm neutrals.
- Include: Venue, sport, date/time, spots left.

## Structured data (future)

If/when we want richer SEO, add JSON-LD Event schema for confirmed sessions.
Avoid adding payment-related Offer schema until we can represent it accurately.

## Share text templates (in-app and social)

### DM / SMS / WhatsApp

Template A (neutral):
- "Open Play at {VenueName} - {Day} {Time}. {SpotsLeft} spots left. Join here: {Url}"

Template B (cost sharing):
- "Open Play at {VenueName} - {Day} {Time}. Est. {Currency} {PerPlayer}/player (split). Join: {Url}"

Template C (invite friends):
- "Want to play? I booked {VenueName} - {Day} {Time}. Join my Open Play here: {Url}"

### Facebook groups / community posts

Post:
- "Open Play at {VenueName} ({City})"
- "When: {Day} {Time}"
- "Sport/Court: {Sport} - {CourtLabel}"
- "Spots: {SpotsLeft} left"
- "Suggested split: {Currency} {PerPlayer}/player (off-app payment to host)"
- "Join link: {Url}"

## Social content (launch-ready)

### LinkedIn post (product update)

Hook:
- "We just launched Open Play: book a court, share the link, and fill the session with other players."

Body bullets:
- "Host books first to secure the slot"
- "Public discovery once the reservation is confirmed"
- "Request-to-join or auto-join"
- "Group chat for confirmed players"
- "Optional suggested split to help share the cost"

CTA:
- "Try it on any venue page: switch to the Open Play tab."

### X / Twitter thread

1) "Open Play is live on KudosCourts."
2) "Book -> turn it into a joinable session -> share -> play."
3) "Join policies: auto-join or host approval."
4) "Confirmed players get group chat."
5) "We don't process payments - but you can add a suggested split + payment instructions."
