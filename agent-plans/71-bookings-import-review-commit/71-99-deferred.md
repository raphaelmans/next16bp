# Deferred Work

Items explicitly out of scope for the review/commit MVP.

---

## Deferred Features

| Feature | Priority | Reason Deferred |
|---------|----------|-----------------|
| List/resume jobs per venue (upload page) | High | MVP supports review by `jobId`; add listing when needed for discoverability |
| Screenshot/image extraction (`sourceType=image`) | High | Requires OCR/vision extraction; MVP returns 0 rows for image imports |
| Pagination/virtualization for huge imports | Medium | MVP can assume smaller exports; optimize when needed |
| Bulk edit (multi-row) | Medium | Start with per-row edit to keep UI and validation simpler |
| Auto-matching courts (fuzzy) | Medium | Can add later after basic mapping UX is proven |
| Creating a new block type `IMPORTED` | Low | `MAINTENANCE` blocks cover the scheduling need; revisit for analytics clarity |
| Audit/history view per job | Low | Useful later; not required for commit correctness |
