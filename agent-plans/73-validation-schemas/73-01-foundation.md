# Phase 1 - Validation Database + Shared Schemas

## Goal

Create a single source of truth for validation constraints/messages and shared Zod v4 primitives. Provide a typed `modifySchema` helper for DTO -> form overrides.

---

## Shared / Contract

- [ ] Add `src/shared/kernel/validation-database.ts` with `validationDatabase` constants.
- [ ] Add `src/shared/kernel/schemas.ts` with:
  - Required/optional string primitives
  - Format checks using `z.check(...)` + top-level validators
  - Numeric/array helpers
  - `modifySchema` helper for typed overrides

### Validation Database Shape

```ts
export const validationDatabase = {
  common: {
    email: {
      required: { message: "Email is required" },
      type: { message: "Email must be a string" },
      min: { value: 1, message: "Email is required" },
      max: { value: 255, message: "Email must be 255 characters or less" },
      invalid: { message: "Please enter a valid email address" },
    },
    password: {
      min: { value: 8, message: "Password must be at least 8 characters" },
      max: { value: 100, message: "Password must be 100 characters or less" },
    },
  },
} as const;
```

### Zod v4 Schema Primitives

```ts
export const emailSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? V.common.email.required.message
        : V.common.email.type.message,
  })
  .trim()
  .min(V.common.email.min.value, { error: V.common.email.min.message })
  .max(V.common.email.max.value, { error: V.common.email.max.message })
  .check(z.email({ error: V.common.email.invalid.message }));
```

### Typed Override Helper

```ts
export function modifySchema<
  Shape extends z.ZodRawShape,
  Overrides extends Partial<{ [K in keyof Shape]: z.ZodTypeAny }>,
>(schema: z.ZodObject<Shape>, overrides: Overrides) {
  return schema.extend(overrides as z.ZodRawShape) as unknown as z.ZodObject<
    Omit<Shape, keyof Overrides> & Overrides
  >;
}
```

---

## Server / Backend

- [ ] No server changes in this phase.

---

## Client / Frontend

- [ ] No client changes in this phase.

---

## Implementation Notes

- Use top-level Zod format validators via `.check(...)` (ex: `.check(z.email({ error: ... }))`).
- Prefer `{ error: "..." }` everywhere for messages.
- Keep DTO schemas strict; provide form-specific overrides in Phase 3.
