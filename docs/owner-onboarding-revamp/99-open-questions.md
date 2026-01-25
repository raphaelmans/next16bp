# Open Questions

1) Where to persist `defaultPortal` (SSR readable)
- Recommended: new table `user_preferences` keyed by `user_id`.
- Acceptable: extend `profile` or `user_roles` (but those already represent different concerns).

2) Naming
- Public marketing route locked: `/owners/get-started`.
- Protected hub route locked: `/owner/get-started`.
- Keep "Claim listing" as user-facing label; use "Transfer" only in support/admin contexts.

3) Import deferred items
- Deterministic normalization + review/edit + commit is implemented.
- Deferred: list/resume jobs per venue on the upload page.
- Deferred: true image/screenshot extraction for `sourceType=image`.
