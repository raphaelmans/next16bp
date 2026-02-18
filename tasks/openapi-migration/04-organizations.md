# Organizations (Owner)

## Endpoints (proposed)

- `POST /api/mobile/v1/owner/organizations` -> create
- `GET /api/mobile/v1/owner/organizations` -> list my orgs
- `PATCH /api/mobile/v1/owner/organizations/{organizationId}` -> update
- `PATCH /api/mobile/v1/owner/organizations/{organizationId}/profile` -> update profile
- `POST /api/mobile/v1/owner/organizations/{organizationId}/logo` (multipart) -> upload logo

## Maps to (tRPC)

- `organization.create`
- `organization.my`
- `organization.update`
- `organization.updateProfile`
- `organization.uploadLogo`
