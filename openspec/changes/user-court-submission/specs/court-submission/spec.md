## ADDED Requirements

### Requirement: Authenticated user can submit a court
The system SHALL allow any authenticated user to submit a new court to the platform. The submission SHALL create a curated place record and a court submission tracking record.

#### Scenario: Successful submission with Google Maps link
- **WHEN** an authenticated user submits a court with a valid Google Maps share link, court name, sport, city, and province
- **THEN** the system SHALL parse the share link server-side to extract latitude and longitude, create a place record (placeType=CURATED, claimStatus=UNCLAIMED, isActive=false), create a courtSubmission record (status=PENDING, submittedByUserId=current user), and return the created court details

#### Scenario: Successful submission with manual coordinates
- **WHEN** an authenticated user submits a court with manual latitude (-90 to 90) and longitude (-180 to 180), court name, sport, city, and province
- **THEN** the system SHALL create a place record and courtSubmission record identical to the Google Maps link flow, using the provided coordinates

#### Scenario: Banned user attempts submission
- **WHEN** a user who has been banned from submissions attempts to submit a court
- **THEN** the system SHALL reject the submission with an error indicating the user is not allowed to submit courts

#### Scenario: Invalid Google Maps link
- **WHEN** an authenticated user submits a court with a URL that is not a valid Google Maps share link or from which lat/lng cannot be extracted
- **THEN** the system SHALL return a validation error indicating the link is invalid

#### Scenario: Missing required fields
- **WHEN** an authenticated user submits a court without court name, sport, city, or province
- **THEN** the system SHALL return a validation error listing the missing fields

### Requirement: Location input via Google Maps share link
The system SHALL support parsing Google Maps share links (maps.app.goo.gl short links and google.com/maps full URLs) to extract latitude, longitude, and a suggested place name. The parsing SHALL NOT call any paid Google APIs (Places, Geocoding). The system SHALL follow URL redirects server-side to resolve short links.

#### Scenario: Short link (maps.app.goo.gl)
- **WHEN** a user provides a maps.app.goo.gl short link
- **THEN** the system SHALL follow redirects to the full URL and extract lat/lng from the resolved URL parameters

#### Scenario: Full Google Maps URL with coordinates
- **WHEN** a user provides a full google.com/maps URL containing coordinate tokens (!3d/!4d or /@lat,lng)
- **THEN** the system SHALL extract the latitude and longitude from the URL and optionally extract a suggested name from the place path segment

### Requirement: Location input via manual coordinates
The system SHALL accept manually entered latitude and longitude values as an alternative to Google Maps links.

#### Scenario: Valid coordinate range
- **WHEN** a user provides latitude between -90 and 90 and longitude between -180 and 180
- **THEN** the system SHALL accept the coordinates for the court location

#### Scenario: Invalid coordinate range
- **WHEN** a user provides latitude or longitude outside valid ranges
- **THEN** the system SHALL return a validation error

### Requirement: Submission rate limiting
The system SHALL rate-limit court submissions per authenticated user to prevent spam.

#### Scenario: Within rate limit
- **WHEN** an authenticated user submits a court and has not exceeded the rate limit
- **THEN** the system SHALL process the submission normally

#### Scenario: Rate limit exceeded
- **WHEN** an authenticated user has exceeded the submission rate limit
- **THEN** the system SHALL reject the submission with a rate limit error

### Requirement: Daily submission quota
The system SHALL enforce a maximum of 10 court submissions per user per calendar day. The quota SHALL be calculated by counting courtSubmission records with createdAt on the current day (in UTC) for the user.

#### Scenario: Within daily quota
- **WHEN** an authenticated user has submitted fewer than 10 courts today
- **THEN** the system SHALL process the submission normally

#### Scenario: Daily quota exceeded
- **WHEN** an authenticated user has already submitted 10 courts today
- **THEN** the system SHALL reject the submission with an error indicating the daily limit has been reached

#### Scenario: Quota resets at midnight
- **WHEN** a new UTC day begins
- **THEN** the user's submission count SHALL reset to 0

### Requirement: Submitted courts require admin approval for visibility
Submitted courts SHALL be created with isActive=false and SHALL NOT appear in public discovery listings until an admin approves the submission.

#### Scenario: Court is hidden after submission
- **WHEN** a user submits a court successfully
- **THEN** the court SHALL NOT appear in public discovery search results or listings

#### Scenario: Court becomes visible after admin approval
- **WHEN** an admin approves a court submission
- **THEN** the associated place SHALL be set to isActive=true and SHALL appear in public discovery listings

### Requirement: User can view their submissions
The system SHALL allow authenticated users to view a list of courts they have submitted, including the current moderation status of each.

#### Scenario: User views their submissions
- **WHEN** an authenticated user requests their submission history
- **THEN** the system SHALL return all courts submitted by that user with their current status (PENDING, APPROVED, REJECTED)

### Requirement: Submission form captures optional details
The system SHALL optionally accept additional details during submission: address text, amenities, contact information (phone, Facebook, Instagram, Viber, website), and photos.

#### Scenario: Submission with optional details
- **WHEN** a user includes optional details (amenities, contact info, photos) in their submission
- **THEN** the system SHALL store these details on the created place record

#### Scenario: Submission with only required fields
- **WHEN** a user submits with only required fields (name, sport, city, province, location)
- **THEN** the system SHALL create the court successfully with no optional details
