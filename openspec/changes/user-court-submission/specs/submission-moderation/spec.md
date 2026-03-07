## ADDED Requirements

### Requirement: Admin can view pending submissions queue
The system SHALL provide admins with a list of user-submitted courts filtered by moderation status, ordered by submission date (oldest first).

#### Scenario: Admin views pending submissions
- **WHEN** an admin requests the submission moderation queue with status=PENDING
- **THEN** the system SHALL return all pending submissions with court details, submitter info, and submission date

#### Scenario: Admin filters by status
- **WHEN** an admin filters submissions by APPROVED or REJECTED status
- **THEN** the system SHALL return only submissions matching that status

### Requirement: Admin can approve a submission
The system SHALL allow admins to approve a pending court submission. Approval SHALL update the submission status to APPROVED. The associated place remains active and unchanged.

#### Scenario: Successful approval
- **WHEN** an admin approves a pending submission
- **THEN** the submission status SHALL change to APPROVED, the place SHALL be set to isActive=true (making it publicly visible), and the action SHALL be logged with the admin's userId

#### Scenario: Approve non-pending submission
- **WHEN** an admin attempts to approve a submission that is not PENDING
- **THEN** the system SHALL return an error indicating the submission is not in a reviewable state

### Requirement: Admin can reject a submission
The system SHALL allow admins to reject a pending court submission with a reason. Rejection SHALL update the submission status to REJECTED and deactivate the associated place.

#### Scenario: Successful rejection
- **WHEN** an admin rejects a pending submission with a reason
- **THEN** the submission status SHALL change to REJECTED, the associated place SHALL be set to isActive=false, the rejection reason SHALL be stored, and the action SHALL be logged

#### Scenario: Reject without reason
- **WHEN** an admin attempts to reject a submission without providing a reason
- **THEN** the system SHALL return a validation error requiring a reason

### Requirement: Admin can edit submitted court details
The system SHALL allow admins to edit the details of a user-submitted court (name, location, sport, contact info, amenities) during or after moderation review, using the existing admin place update capabilities.

#### Scenario: Admin edits court during review
- **WHEN** an admin modifies a submitted court's details
- **THEN** the system SHALL update the place record with the new details using the existing admin update flow

### Requirement: Submission attribution tracking
The system SHALL track which user submitted each court and when, persisted in the courtSubmission record. This attribution SHALL be visible to admins in the moderation queue.

#### Scenario: Attribution visible in admin queue
- **WHEN** an admin views a submission in the moderation queue
- **THEN** the system SHALL display the submitter's email/name and submission timestamp

### Requirement: Admin can ban a user from submitting courts
The system SHALL allow admins to ban a specific user from making future court submissions. Banned users SHALL be prevented from submitting at the API level.

#### Scenario: Admin bans a user
- **WHEN** an admin bans a user from court submissions with a reason
- **THEN** the system SHALL create a ban record (userId, bannedByUserId, reason, timestamp) and all future submission attempts by that user SHALL be rejected

#### Scenario: Admin unbans a user
- **WHEN** an admin removes a submission ban for a user
- **THEN** the user SHALL be able to submit courts again

### Requirement: Admin can distinguish user-submitted from admin-curated courts
The system SHALL allow admins to identify which courts were user-submitted vs admin-curated in the admin courts list.

#### Scenario: Source indicator in admin courts list
- **WHEN** an admin views the courts list in the admin panel
- **THEN** each court SHALL display a source indicator showing "User Submitted" (with submitter info) or "Admin Curated" based on whether a courtSubmission record exists
