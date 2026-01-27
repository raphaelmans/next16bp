# Phase 3 - Frontend Form + Feature Schema Migration

## Goal

Derive form schemas from DTOs using `modifySchema` and shared primitives. Replace inline Zod schemas in feature components/pages.

---

## Shared / Contract

- [ ] Use `modifySchema` to override DTO fields for form-specific needs.
- [ ] Use shared primitives for repeated patterns (optional URL, phone, coordinate inputs).

---

## Server / Backend

- [ ] No server changes in this phase.

---

## Client / Frontend

- [ ] Update feature schemas:
  - `src/features/organization/components/organization-form.tsx`
  - `src/features/owner/schemas/place-form.schema.ts`
  - `src/features/owner/schemas/court-form.schema.ts`
  - `src/features/owner/schemas/organization.schema.ts`
  - `src/features/owner/schemas/organization-payment-method.schema.ts`
  - `src/features/admin/schemas/admin-court-edit.schema.ts`
  - `src/features/admin/schemas/curated-court.schema.ts`
  - `src/features/admin/schemas/curated-court-batch.schema.ts`
  - `src/features/reservation/schemas/profile.schema.ts`
  - `src/features/reservation/schemas/mark-payment.schema.ts`
- [ ] Replace inline Zod form schemas in pages:
  - `src/app/(public)/places/[placeId]/place-detail-client.tsx`
  - `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx`

### Form Override Patterns

```ts
export const CreateProfileFormSchema = modifySchema(CreateProfileSchema, {
  firstName: firstNameSchema.or(z.literal("")),
}).superRefine((value, ctx) => {
  if (value.firstName === "") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["firstName"],
      message: V.profile.firstName.min.message,
    });
  }
});
```

---

## Implementation Notes

- Keep form defaults and normalization logic in place (do not rewire submit payloads).
- Prefer trimming in schema primitives; avoid ad-hoc `.trim()` in components.
