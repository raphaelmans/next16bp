# Organization Domain

> Generated manually from source code (Source of Truth)

## Purpose

The Organization domain represents the legal entities (venue owners/operators) that manage Places and Courts. It handles tenant isolation, profile management, and configuration of business rules such as reservation policies and payment methods.

## Data Model

Based on `src/lib/shared/infra/db/schema/organization.ts` and `organization-payment.ts`:

### `Organization`
- **Identity**: `id`, `slug` (Unique)
- **Ownership**: `ownerUserId` (Supabase Auth ID)
- **Metadata**: `name`, `isActive`

### `OrganizationProfile`
- **Identity**: `id`, `organizationId` (1:1)
- **Details**: `description`, `logoUrl`, `contactEmail`, `contactPhone`, `address`

### `OrganizationReservationPolicy`
- **Identity**: `id`, `organizationId` (1:1)
- **Rules**:
  - `requiresOwnerConfirmation`: Boolean (default true)
  - `paymentHoldMinutes`: TTL for payment window (default 45)
  - `ownerReviewMinutes`: TTL for acceptance window (default 45)
  - `cancellationCutoffMinutes`: Minimum lead time for cancellations

### `OrganizationPaymentMethod`
- **Identity**: `id`, `organizationId`
- **Details**: `type` (BANK/E_WALLET), `provider` (GCASH, BDO, etc.), `accountName`, `accountNumber`
- **UX**: `instructions`, `isActive`, `isDefault`, `displayOrder`

## API & Actions

Based on `src/lib/modules/organization/organization.router.ts`:

### Management
- **`create`**: Register a new organization.
- **`update`**: Modify name or slug.
- **`updateProfile`**: Update public details (logo, contacts).
- **`uploadLogo`**: Handle file upload for organization branding.

### Queries
- **`get` / `getBySlug`**: Public retrieval of organization details.
- **`getLandingBySlug`**: Aggregated data for organization landing pages.
- **`my`**: Retrieve organizations owned by the current user.

## Key Logic

- **Single Owner**: Currently models a 1:1 relationship between a User and an Organization (via `ownerUserId`), though the schema could support many-to-many in the future.
- **Policy Configuration**: Each organization configures its own reservation TTLs (`paymentHoldMinutes`, `ownerReviewMinutes`), which the Reservation domain consumes.
- **Payment Methods**: Stores "instructions" for P2P payments (e.g., "Send screenshot to Viber"), not actual payment gateway credentials.

## Requirements

### Requirement: `organization.my` SHALL return organizations accessible to current user
The system SHALL return organizations where the current user is either canonical owner or active invited member.

#### Scenario: Manager sees assigned organization
- **WHEN** a user is not `organization.ownerUserId` but has active `organization_member` row for that organization
- **THEN** `organization.my` includes that organization in response

#### Scenario: Revoked member not included
- **WHEN** a membership status is `REVOKED`
- **THEN** `organization.my` excludes that organization for the revoked user
