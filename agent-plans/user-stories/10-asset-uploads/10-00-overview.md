# Asset Uploads - User Stories

## Overview

This domain covers file upload functionality using Supabase Storage. It enables players, owners, and admins to upload various assets (profile avatars, payment proofs, court photos, organization logos) with proper access control and validation.

**Key Capabilities:**
- Profile avatar uploads for players
- Payment proof uploads for reservation verification
- Court photo uploads for owners and admins
- Organization logo uploads for owners

---

## References

| Document | Path |
|----------|------|
| PRD | `context.md` → Section 11 (Player Profiles), Section 12 (Organization Management) |
| Existing Upload Component | `src/shared/components/kudos/file-upload.tsx` |
| File Upload Guide | `guides/client/references/13-file-upload.md` |

---

## Technical Design Decisions

### Bucket Structure

| Bucket | Purpose | Access |
|--------|---------|--------|
| `avatars` | Player profile pictures | Private (user's own) |
| `payment-proofs` | Payment verification screenshots | Private (player + owner) |
| `court-photos` | Court images | Private (owner + admin) |
| `organization-assets` | Organization logos | Private (owner + admin) |
| `place-photos` | Place images | Public (discovery + booking) |

### Path Conventions

| Asset Type | Path Pattern | Notes |
|------------|--------------|-------|
| Avatar | `{userId}/avatar.{ext}` | Single file, upsert allowed |
| Payment Proof | `{reservationId}/{timestamp}.{ext}` | Multiple files per reservation |
| Court Photo | `{courtId}/{photoId}.{ext}` | Multiple photos per court |
| Organization Logo | `{organizationId}/logo.{ext}` | Single file, upsert allowed |
| Place Photo | `{placeId}/{photoId}.{ext}` | Multiple photos per place |

### File Constraints

| Constraint | Value |
|------------|-------|
| Max file size | 5MB |
| Allowed image types | `image/jpeg`, `image/png`, `image/webp` |
| Avatar dimensions | Recommended 256x256 (not enforced) |

### RLS Policy Summary

| Bucket | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `avatars` | Own only | Own only | Own only | Own only |
| `payment-proofs` | Player (own) + Owner | Player (own reservation) | - | - |
| `court-photos` | Authenticated | Owner (own courts) + Admin | Owner + Admin | Owner + Admin |
| `organization-assets` | Authenticated | Owner (own org) | Owner (own org) | Owner (own org) |
| `place-photos` | Everyone (public) | Owner (own places) + Admin | Owner + Admin | Owner + Admin |

---

## Story Index

| ID | Story | Status | Supersedes |
|----|-------|--------|------------|
| US-10-01 | Player Uploads Profile Avatar | Active | - |
| US-10-02 | Player Uploads Payment Proof | Active | - |
| US-10-03 | Owner Uploads Court Photos | Active | - |
| US-10-04 | Owner Uploads Organization Logo | Active | - |
| US-10-05 | Admin Uploads Court Photos | Active | - |
| US-10-06 | Owner Uploads Place Photos | Active | - |
| US-10-99 | Deferred: Public Buckets & Optimization | Deferred | - |

---

## Summary

- Total: 7
- Active: 6
- Deferred: 1
