## ADDED Requirements

### Requirement: Organizations SHALL have an assigned plan for quota evaluation
The system SHALL maintain an assignable plan for each organization. The initial supported plans SHALL be `FREE` and `BUSINESS_PLUS`.

#### Scenario: Existing organizations default to free
- **WHEN** an existing organization has no historical paid-plan assignment at rollout time
- **THEN** the system treats that organization as `FREE`

#### Scenario: Plan is returned for quota evaluation
- **WHEN** a quota-governed organization service is evaluated
- **THEN** the system provides the organization’s current assigned plan

### Requirement: Plan context SHALL include billing-cycle boundaries
The system SHALL provide quota evaluation with the billing-cycle window associated with the organization’s current plan context.

#### Scenario: Manual plan assignment defines billing anchor
- **WHEN** an administrator assigns or updates an organization plan manually
- **THEN** the system stores enough billing-cycle context to evaluate future quota windows

#### Scenario: Billing-cycle context is exposed through plan resolution
- **WHEN** a quota-governed service resolves organization plan context
- **THEN** the result includes the active billing-cycle start and end boundaries

### Requirement: Administrators SHALL be able to manage organization plans manually
The system SHALL allow administrators to view and change an organization’s assigned plan before external subscription-provider integration exists.

#### Scenario: Admin upgrades organization to business plus
- **WHEN** an administrator assigns `BUSINESS_PLUS` to an organization
- **THEN** subsequent quota evaluation uses the `BUSINESS_PLUS` SMS allowance

#### Scenario: Admin downgrades organization to free
- **WHEN** an administrator changes an organization back to `FREE`
- **THEN** subsequent quota evaluation uses the `FREE` SMS allowance

### Requirement: Plan resolution SHALL remain adapter-driven
The system SHALL resolve organization plan context through an adapter boundary so the manual implementation can later be replaced or augmented by a subscription-provider-backed implementation without changing quota consumers.

#### Scenario: Manual source satisfies current plan resolution
- **WHEN** the system resolves plan context in v1
- **THEN** the manual plan-assignment implementation provides the current plan and billing-cycle context

#### Scenario: Future provider integration can replace manual source
- **WHEN** a subscription-provider-backed plan source is introduced in the future
- **THEN** quota-governed service consumers continue to use the same plan-resolution contract
