## ADDED Requirements

### Requirement: Public owner organization guide article
The system SHALL publish a public owner guide focused on setting up and operating a sports venue organization on KudosCourts through the existing `/guides/[slug]` article route.

#### Scenario: Organization guide article is available
- **WHEN** a visitor opens `/guides/how-to-set-up-your-sports-venue-organization-on-kudoscourts`
- **THEN** the page shows the guide title, description, intro, sections, FAQs, and related links using the existing guide article experience

### Requirement: Organization guide covers the full owner setup journey
The organization guide SHALL explain the owner flow from setup wizard through operational readiness, including organization creation, venue and court setup, verification, notifications, team access, and reservation handling.

#### Scenario: Guide covers required lifecycle topics
- **WHEN** a visitor reads the organization guide
- **THEN** the guide includes sections that address setup wizard tasks, turning on notifications, team access, and handling reservations before going live

### Requirement: Owner guides index includes the organization guide
The system SHALL include the organization guide in the owner-guides section of `/guides`.

#### Scenario: Owner guide appears on guides index
- **WHEN** a visitor opens `/guides`
- **THEN** the owner-guides section includes a card linking to the organization guide alongside the existing owner guide

### Requirement: Organization guide uses public conversion links
The organization guide SHALL link readers only to public discovery and owner-entry surfaces from its related links.

#### Scenario: Related links avoid protected destinations
- **WHEN** a visitor interacts with the organization guide related links
- **THEN** each destination is publicly accessible, including `/owners/get-started`, `/guides`, or discovery pages such as `/courts`
