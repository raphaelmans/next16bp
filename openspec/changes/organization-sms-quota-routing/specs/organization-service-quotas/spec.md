## ADDED Requirements

### Requirement: Costly service quotas SHALL be evaluated per organization plan and billing cycle
The system SHALL evaluate costly-service quotas using the organization’s current plan and active billing-cycle window. The first quota-governed service in v1 SHALL be `SMS`.

#### Scenario: Free plan SMS quota is limited
- **WHEN** an organization on the `FREE` plan is evaluated for SMS quota in its active billing cycle
- **THEN** the quota allowance is 10 SMS for that billing cycle

#### Scenario: Business Plus SMS quota is higher
- **WHEN** an organization on the `BUSINESS_PLUS` plan is evaluated for SMS quota in its active billing cycle
- **THEN** the quota allowance is 100 SMS for that billing cycle

### Requirement: SMS quota exhaustion SHALL hard-stop SMS only
When an organization has exhausted its SMS quota for the active billing cycle, the system SHALL block further organization-side SMS delivery for that cycle and SHALL leave other transports unaffected.

#### Scenario: SMS is skipped when quota is exhausted
- **WHEN** an organization-side SMS delivery is evaluated and the organization has already consumed its SMS allowance for the active billing cycle
- **THEN** the system skips that SMS delivery

#### Scenario: Other transports continue when SMS is skipped
- **WHEN** an organization-side SMS delivery is skipped because the organization is out of SMS quota
- **THEN** inbox, email, web push, and mobile push behavior for the same event remains unchanged

### Requirement: Successful provider acceptance SHALL consume quota usage
The system SHALL record organization service usage only after the provider accepts the SMS send request, so quota consumption reflects successful external delivery attempts rather than queued or failed attempts.

#### Scenario: Accepted SMS increments usage
- **WHEN** the SMS provider accepts an organization-side SMS send request
- **THEN** the system records one SMS usage unit for that organization and billing cycle

#### Scenario: Failed or skipped SMS does not increment usage
- **WHEN** an organization-side SMS is skipped or the provider rejects the send request
- **THEN** the system does not record a consumed SMS usage unit for that delivery

### Requirement: Costly service usage SHALL be auditable
The system SHALL retain organization service usage records with enough metadata to identify the organization, costly service, billing window, quantity, and source event or delivery reference.

#### Scenario: Usage record includes billing-window context
- **WHEN** a successful organization-side SMS usage record is created
- **THEN** the record includes the organization, service type, quantity, and billing-cycle context used for quota evaluation

#### Scenario: Usage record includes source reference
- **WHEN** a successful organization-side SMS usage record is created
- **THEN** the record includes a reference to the originating event or delivery attempt for auditability
