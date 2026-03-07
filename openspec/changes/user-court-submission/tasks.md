## 1. Database Schema

- [x] 1.1 Create `courtSubmission` table in Drizzle schema (`src/lib/shared/infra/db/schema/court-submission.ts`) with columns: id (UUID), placeId (FK), submittedByUserId (FK to auth.users), status (PENDING/APPROVED/REJECTED), rejectionReason (nullable text), reviewedByUserId (nullable FK), reviewedAt (nullable timestamp), createdAt, updatedAt
- [x] 1.2 Create `courtSubmissionBan` table in the same schema file with columns: id (UUID), userId (FK to auth.users), bannedByUserId (FK to auth.users), reason (text), createdAt
- [x] 1.3 Export the new schemas from the schema barrel file (`src/lib/shared/infra/db/schema/index.ts`)
- [ ] 1.4 Generate and apply Drizzle migration (`pnpm db:generate && pnpm db:migrate`)

## 2. Court Submission Module (Server)

- [x] 2.1 Create court submission repository (`src/lib/modules/court-submission/repositories/court-submission.repository.ts`) with: create, findById, findByUserId, findByStatus, updateStatus
- [x] 2.2 Create court submission ban repository (same dir) with: create, delete, findByUserId
- [x] 2.3 Create court submission service (`src/lib/modules/court-submission/services/court-submission.service.ts`) with: submitCourt (check ban → check daily quota (max 10/day) → transaction: create place with isActive=false → create submission record), getMySubmissions, getDailyCount
- [x] 2.4 Create submission input DTO/schema (`src/lib/modules/court-submission/court-submission.dto.ts`) with Zod validation: name, sportId, city, province, locationMode (link/manual), googleMapsLink?, latitude?, longitude?, optional amenities/contact/address
- [x] 2.5 Create tRPC router (`src/lib/modules/court-submission/court-submission.router.ts`) with protected procedures: submit (rate-limited, ban-checked), getMySubmissions
- [x] 2.6 Add Google Maps link parsing to the submission flow — reuse `parseGoogleMapsLink()` from `src/lib/modules/google-loc/` for lat/lng extraction without API geocoding calls
- [x] 2.7 Register the router in the main tRPC app router

## 3. Submission Moderation (Server)

- [x] 3.1 Create admin moderation service (`src/lib/modules/court-submission/services/submission-moderation.service.ts`) with: listSubmissions (filter by status), approveSubmission (set place isActive=true), rejectSubmission (with reason, place stays isActive=false), banUser, unbanUser
- [x] 3.2 Create admin moderation router (`src/lib/modules/court-submission/admin/admin-submission.router.ts`) with admin procedures: list, approve, reject, ban, unban
- [x] 3.3 Register the admin router in the main tRPC app router

## 4. Admin Courts List Enhancement

- [x] 4.1 Add "Source" indicator to admin courts list — query courtSubmission join to show "User Submitted" (with submitter info) vs "Admin Curated" badge per court
- [x] 4.2 Add search by court name and filter by city/province/sport/source/active status to the admin courts list
- [x] 4.3 Add sort options (name, city, created date, active status) to the admin courts list
- [x] 4.4 Add bulk selection with bulk actions: activate, deactivate, delete selected courts

## 5. Submission Form (Frontend)

- [x] 5.1 Create submission feature directory (`src/features/court-submission/`)
- [x] 5.2 Build submission form component with: court name, sport selector, city, province, location mode toggle (Google Maps link vs manual coordinates), optional fields (address, amenities, contact info)
- [x] 5.3 Add Google Maps link input with preview — on paste/blur, call tRPC to parse link and show extracted lat/lng on a static map embed
- [x] 5.4 Add manual coordinate input fields with validation
- [x] 5.5 Wire form to tRPC `courtSubmission.submit` mutation with loading state and success feedback
- [x] 5.6 Create submission page route (`src/app/(auth)/submit-court/page.tsx`) with CTA accessible from discovery page ("Know a court? Add it!")
- [x] 5.7 Show success state explaining the court is pending admin review

## 6. My Submissions View (Frontend)

- [x] 6.1 Create "My Submissions" component showing user's submitted courts with status badges (PENDING/APPROVED/REJECTED)
- [x] 6.2 Add page route or section in user profile for viewing submissions

## 7. Admin Moderation UI (Frontend)

- [x] 7.1 Create admin submissions list page (`src/app/(admin)/admin/submissions/page.tsx`) with status filter tabs (PENDING/APPROVED/REJECTED)
- [x] 7.2 Build submission review card/row showing court details, submitter info, location map preview
- [x] 7.3 Add approve and reject actions (reject with reason input modal)
- [x] 7.4 Add ban/unban user action from the moderation queue (ban with reason)

## 8. Verification & Cleanup

- [ ] 8.1 Verify submission flow end-to-end: submit with Google Maps link → court is hidden → admin approves → court appears in discovery
- [ ] 8.2 Verify submission flow with manual coordinates
- [ ] 8.3 Verify banned user cannot submit
- [ ] 8.4 Verify rate limiting and daily quota (max 10/day) works on submission endpoint
- [ ] 8.5 Verify admin courts list shows source indicator
- [x] 8.6 Run `pnpm lint` to ensure no lint errors
