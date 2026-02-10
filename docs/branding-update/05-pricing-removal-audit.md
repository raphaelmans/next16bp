# “Pricing” Removal Audit (Public Surfaces)

## Goal

Remove “Pricing” as a SaaS-plan concept from public navigation and marketing copy.

## Remove / Replace

- Footer link labeled “Pricing” → remove.
- Public copy that uses “pricing” to mean venue rates → replace with **rates** or **price**.

## Keep (Owner ops)

- “Schedule & Pricing”, “pricing rules” inside owner tooling are about **venue rate rules**, not SaaS plans.
  Optional future rename to “rates” for clarity, but not required for this branding update.

## Verification commands

Run after implementation:

- `rg -n "\\bPricing\\b" src -S`
- `rg -n "\\bpricing\\b" src/app\\/(public) -S`

