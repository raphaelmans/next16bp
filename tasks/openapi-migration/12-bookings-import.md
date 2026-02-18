# Bookings Import (Owner) - Optional

This is in Phase 1 docs, but is optional for the first REST cutover.

Maps to (tRPC)
- `bookingsImport.createDraft` (multipart)
- `bookingsImport.getJob`
- `bookingsImport.listJobs`
- `bookingsImport.listRows`
- `bookingsImport.normalize`
- `bookingsImport.commit`

Watchouts:
- Large uploads + long-running normalization may exceed serverless limits.
- Consider later split: direct-to-storage upload + async job polling.
