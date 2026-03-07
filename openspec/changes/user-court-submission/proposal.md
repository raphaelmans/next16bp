## Why

Courts are currently added only by admins (curated) or by verified venue owners (reservable). Many courts exist that the platform doesn't know about. Letting authenticated users submit courts they play at creates a social funnel: "Add your favorite courts to help other players discover them." This turns every user into a scout, growing the court database organically through social media campaigns targeting cities/towns.

## What Changes

- New public court submission flow for authenticated users (separate from admin curation and owner place management)
- Submission captures: court name, sport(s), city/province, location via Google Maps share link OR manual lat/lng coordinates, optional photos and contact info
- No Google Maps Places API / Geocoding API calls for user submissions — only parse Google Maps share links client-side to extract lat/lng (cost control)
- Submitted courts enter as curated places with isActive=false — NOT visible until admin approves
- Admin moderation queue to review, edit, approve, or reject user-submitted courts
- Admin can ban specific users from submitting (spam/abuse prevention)
- Admin courts list enhanced with source indicators (User Submitted vs Admin Curated) and improved management
- Attribution: track which user submitted each court

## Capabilities

### New Capabilities

- `court-submission`: Authenticated user flow for submitting a new court — form UI, tRPC endpoint, Google Maps share link parsing (client-side), manual coordinate entry, submission persistence as curated place
- `submission-moderation`: Admin queue to review user-submitted courts — list pending submissions, approve/edit/reject actions, attribution tracking

### Modified Capabilities

None — existing place creation (admin curated + owner reservable) and verification flows remain unchanged.

## Impact

- **Schema**: New `courtSubmission` table for submission tracking + `courtSubmissionBan` table for user bans
- **tRPC**: New `courtSubmission` router (protected) with `submit` + `getMySubmissions` procedures
- **tRPC**: New admin submission router with moderation procedures (`list`, `approve`, `reject`, `ban`, `unban`)
- **UI**: New submission page accessible from discovery page CTA
- **UI**: Admin moderation page for reviewing submissions with ban/unban actions
- **UI**: Admin courts list enhanced with source indicator and improved management
- **Google Maps link parsing**: Reuse existing `src/lib/modules/google-loc/` preview logic but constrained to link parsing only (no API geocoding calls for user submissions)
- **No new external API costs**: Location resolution relies on share link extraction or manual coordinates only
