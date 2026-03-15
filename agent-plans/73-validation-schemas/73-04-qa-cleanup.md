# Phase 4 - QA + Cleanup

## Goal

Validate the migration, remove dead helpers, and ensure all Zod usage follows the new conventions.

---

## Shared / Contract

- [ ] Confirm no duplicate validation constants outside `validation-database.ts`.

---

## Server / Backend

- [ ] Ensure router inline schemas are replaced where practical.
- [ ] Confirm DTOs contain all messages (no default Zod messages).

---

## Client / Frontend

- [ ] Verify all form schemas show friendly messages.
- [ ] Confirm no inline Zod schemas remain in feature components/pages unless justified.

---

## QA Checklist

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
- [ ] Manual sanity checks: login/register, organization create, claim/remove, owner settings, place/court forms.
