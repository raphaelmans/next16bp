## Context

Courts are added through two paths today: admin curated creation (`adminCourtRouter.createCurated`) and org-owner place management (`placeManagementRouter.create`). Both require elevated access. The platform wants to grow its court database organically by letting any authenticated user submit courts they know about — targeting social media campaigns ("add your favorite courts in your city").

Google Maps APIs (Places, Geocoding) are expensive. The admin flow uses `google-loc` service with full API calls. For user submissions, we avoid API costs by only supporting: (1) pasting a Google Maps share link (parsed client-side to extract lat/lng) or (2) manual lat/lng entry.

Key existing infrastructure:
- `place` table with `placeType` (CURATED/RESERVABLE) and `claimStatus` — `src/lib/shared/infra/db/schema/place.ts`
- Google Maps link parser in `src/lib/modules/google-loc/` (extracts lat/lng, place ID from share URLs)
- Place repository/service at `src/lib/modules/place/`
- Auth context with `protectedProcedure` and rate limiting in tRPC

## Goals / Non-Goals

**Goals:**
- Let authenticated users submit courts with minimal friction (name, sport, location, optional details)
- Extract location from Google Maps share links without server-side API calls
- Track submission attribution (who submitted what)
- Provide admin moderation queue for reviewing submissions
- Submitted courts are hidden (isActive=false) until admin approves them
- Admin can ban users from submitting courts (spam/abuse prevention)
- Admin can distinguish user-submitted courts from admin-curated ones

**Non-Goals:**
- No Google Maps autocomplete or Places API on the submission form (cost control)
- No anonymous submissions (auth required)
- No changes to the existing admin curated or owner reservable creation flows
- No verification flow changes — submissions start as UNVERIFIED, owners can later claim and verify
- No bulk import or CSV upload

## Decisions

### 1. Extend `place` table vs. new `court_submission` table

**Decision**: Add `submittedByUserId` column to `place` table + new `courtSubmission` tracking table.

The `place` table already holds curated courts. User-submitted courts are functionally identical — they appear in discovery the same way. Adding a `submittedByUserId` FK on `place` tracks attribution directly. A separate `courtSubmission` table tracks submission metadata (status, moderation notes, rejection reason) without bloating the `place` schema.

**Alternative considered**: Store everything in `place` with status columns. Rejected because moderation workflow (pending/approved/rejected with notes) is a separate concern from the place entity.

### 2. Google Maps link parsing: server-side vs. client-side

**Decision**: Server-side parsing using existing `google-loc` service `preview()` method but **skip the geocoding API call**. The existing `parseGoogleMapsLink()` already extracts lat/lng from the URL structure without API calls. Only the place ID resolution step calls the API — we skip that for user submissions.

Reuse `src/lib/modules/google-loc/google-loc.service.ts` link-parsing logic (redirect following + URL regex extraction). The lat/lng extraction from `!3d`/`!4d` tokens and `/@lat,lng` patterns is pure parsing with no API cost.

**Alternative considered**: Client-side parsing. Rejected because share links (maps.app.goo.gl) require redirect following which needs server-side fetch.

### 3. Submission status flow

**Decision**: Simple 3-state flow: `PENDING` → `APPROVED` | `REJECTED`.

- On submit: create `place` record (placeType=CURATED, **isActive=false**) + `courtSubmission` record (status=PENDING)
- Place is NOT visible in discovery until approved
- Admin approves: submission status → APPROVED, place → isActive=true (now visible in discovery)
- Admin rejects: submission status → REJECTED, place remains isActive=false

This prevents spam/low-quality courts from polluting the platform while still keeping the submission flow lightweight for users.

### 3b. User banning

**Decision**: Add a `submissionBanned` boolean (or `submissionBannedAt` timestamp) to the `courtSubmission` module. When an admin bans a user from submissions, the system blocks new submissions at the tRPC procedure level. Stored in a `courtSubmissionBan` table (userId, bannedByUserId, reason, createdAt) to keep an audit trail.

**Alternative considered**: Boolean on user profile. Rejected because submission banning is a concern of this module, not core auth.

### 3c. Admin distinguishing user-submitted courts

**Decision**: In the admin courts list, user-submitted courts are identifiable by having a linked `courtSubmission` record. Add a "Source" column/badge showing "User Submitted" vs "Admin Curated" based on whether a courtSubmission record exists for the place. The admin moderation queue is a separate dedicated page for pending submissions only.

### 4. Location input modes

**Decision**: Two mutually exclusive modes on the submission form:
1. **Google Maps link** — paste a share URL, server parses lat/lng + suggested name
2. **Manual coordinates** — enter lat/lng directly (for users who know exact coordinates)

Both produce the same output: `latitude`, `longitude`, and optionally a suggested `address` string. City/province are required text fields regardless of mode.

### 5. Rate limiting + daily quota

**Decision**: Two layers of protection:
1. **Rate limiting**: Use existing `protectedRateLimitedProcedure` for burst protection
2. **Daily quota**: Max 10 submissions per user per calendar day (UTC). Checked by counting `courtSubmission` records where `createdAt >= start of today (UTC)` for the user. No extra table needed — the `courtSubmission` table already has `submittedByUserId` + `createdAt` which can be indexed for this query.

## Risks / Trade-offs

- **[Spam/low-quality submissions]** → Rate limiting + admin moderation queue + user banning. Courts are hidden until approved, so spam never reaches users.
- **[Duplicate courts]** → No automated dedup in v1. Admin reviews catch duplicates. Future: proximity-based duplicate detection.
- **[Google Maps link format changes]** → Existing parser handles multiple URL formats and follows redirects. Risk is low but parser may need updates over time.
- **[Moderation bottleneck]** → If submission volume grows faster than admin capacity, courts may sit in PENDING for a while. Acceptable for quality control. Could add auto-approve for trusted submitters later.
