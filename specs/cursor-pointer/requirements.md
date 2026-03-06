# Cursor Pointer — Requirements

## Q&A

### Q1: Global CSS or per-component edits?
**A:** ~~Global CSS~~ Per-component edits — add `cursor-pointer` directly to each shadcn-ui component that is clickable.

### Q2: Scope beyond shadcn?
**A:** Covered by Q1 — strictly shadcn-ui components, per-component edits.

### Q3: Default or optional?
**A:** Bake `cursor-pointer` into default classes via `cn()`, so it's always present but overridable by consumers.

### Q4: Disabled state cursor?
**A:** Leave as-is — don't add explicit disabled cursor overrides.
