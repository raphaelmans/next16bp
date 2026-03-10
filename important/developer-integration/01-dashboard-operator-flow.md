# Dashboard Operator Flow

## Purpose

Use the Developers dashboard to create the internal configuration boundary that makes the public developer API safe to hand off.

The dashboard covers:

1. Integration creation
2. API key issuance
3. Court mapping
4. Server-side precheck
5. One guided live availability read

## Prerequisites

- An owner or manager account with `place.manage`
- At least one active venue and one active court in the organization
- A clear external system name for the integration
- A plan for where the one-time secret will be stored immediately after key creation

## Route Families

The dashboard talks to the cookie-auth owner routes, not the mobile route family:

- `GET/POST /api/organization/organizations/:organizationId/developer-integrations`
- `GET/POST /api/organization/organizations/:organizationId/developer-integrations/:integrationId/keys`
- `GET /api/organization/organizations/:organizationId/developer-integrations/:integrationId/court-mappings`
- `PUT/DELETE /api/organization/organizations/:organizationId/developer-integrations/:integrationId/courts/:courtId/mapping`
- `POST /api/organization/organizations/:organizationId/developer-integrations/:integrationId/precheck`
- `POST /api/organization/organizations/:organizationId/developer-integrations/:integrationId/test-console/availability`

## Recommended Operator Sequence

### 1. Create a dedicated integration

- Create one integration per partner system, deployment environment, or venue stack boundary.
- Do not reuse an existing production integration for smoke validation if you want isolated mappings and cleaner key rotation.

### 2. Issue a scoped key and capture the secret once

- For read-only onboarding, `availability.read` is enough.
- For a full end-to-end smoke that includes external writes, create a temporary key with both:
  - `availability.read`
  - `availability.write`
- Copy the secret immediately into the target secret manager or operator handoff notes. After creation, the dashboard keeps only the masked prefix and metadata.

### 3. Map one external court id first

- Start with the first real court you want to validate.
- Assign one explicit external court id and save it.
- Expand to the rest of the venue only after the first court passes precheck and live read verification.

### 4. Run the server-side precheck

The precheck validates the fixed onboarding contract:

- integration active
- API key active
- required read scope present
- mapped court available
- live availability read succeeds

Treat a green precheck as the minimum handoff bar.

### 5. Run one guided live availability read

- Use the selected key, mapped external court id, date, duration, and `includeUnavailable` toggle from the dashboard.
- Capture the request id and response payload.
- Use this as the internal proof that the owner-side configuration is complete before switching to external `curl` validation.

## Operational Notes

- The guided console is intentionally read-only.
- The dashboard will generate a real cURL snippet only while the currently selected key is the same key whose secret was just revealed.
- If you switch away from that key later, snippets fall back to `YOUR_API_KEY` by design.
- Public write validation belongs in the next stage, outside the browser.
