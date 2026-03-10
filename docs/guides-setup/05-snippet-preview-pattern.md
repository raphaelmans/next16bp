# Snippet Preview Pattern

## The intended rule

The intended pattern is:

1. Reuse the exact production component whenever it can be rendered safely in preview mode.
2. If the production component cannot be rendered safely, create a preview-only copy that preserves the real UI shape.
3. Always render the preview inside a standard inert wrapper so the guide feels like a product walkthrough, not an embedded app session.

This is the "what you see is what you get" rule.

## Current implementation in this repo

The repo already follows the broad pattern, but with two implementation styles:

### Direct reuse of real components

Some snippet previews import production components directly, for example:

- `AvailabilityWeekGrid`
- `WeekNavigator`
- `PlaceDetailBookingSummaryCard`
- `StatusBanner`

This is the preferred approach because the guide preview stays visually aligned with the actual product.

### Preview-only copies

Other previews are guide-specific mock twins such as:

- `MockOrganizationForm`
- `MockCourtForm`
- `MockBookingLoginForm`
- `MockReservationsPending`

These exist because some production surfaces are too coupled to live state, mutations, stores, auth, navigation, or side effects to embed directly inside an inert guide.

## The wrapper contract

`guide-snippet-wrapper.tsx` does three important things:

- Adds a consistent visual container.
- Labels the block as `What you will see`.
- Applies `pointer-events-none` and `select-none` so the preview behaves like a screenshot made of real components.

That wrapper is not optional. It is what turns a component preview into guide content.

## Recommended replication rule for the new repo

Adopt this exact decision tree.

### Level 1: Reuse the production component

Use the real component if you can provide:

- Stable props
- Static data
- No-op handlers
- Read-only mode
- Disabled controls
- Mock providers that do not mutate real app state

This should be the default target.

### Level 2: Create a preview adapter

If the production component needs a small amount of setup, create an adapter in the guide layer that:

- Supplies mock props
- Disables navigation
- Replaces callbacks with no-ops
- Wraps the real component in any local provider stubs

Prefer an adapter before copying markup.

### Level 3: Copy only for preview rendering

Only copy the component when the production component is too entangled to reuse without dragging in real app behavior.

If you create a copied preview component:

- Keep it in the guide snippet file or a guide-only snippet module.
- Mirror the production layout and visual states closely.
- Remove only the parts that make it unsafe in guide context.
- Add a comment naming the production component it mirrors.
- Treat the copied preview as a parity surface that must be updated when the real UI changes.

## Practical parity checklist

When making a preview-only copy, keep these aligned with production:

- Layout structure
- Major spacing
- Typography hierarchy
- Surface hierarchy
- Visual states and badges
- Icons
- Labels and CTA text
- Empty, pending, or success states shown in the guide

Do not try to simulate full behavior. The preview only needs to faithfully show the intended UI state.

## Snippet mapping pattern

Each interactive guide exposes a resolver like:

```ts
const GUIDE_SNIPPET_MAP: Record<string, React.ComponentType> = {
  "some-section-id": SomeSnippet,
};

export function getGuideSnippetForSection(sectionId: string) {
  return GUIDE_SNIPPET_MAP[sectionId] ?? null;
}
```

This is better than embedding snippet components directly into the content data because:

- The content files stay declarative.
- The snippet layer stays React-only.
- Missing snippet mappings degrade gracefully.

## Strong recommendation for the new repo

Write this rule into your local docs or code review checklist:

"Guide previews must use the exact production component first. Copying a component is allowed only for preview rendering when reuse is unsafe or disproportionately expensive, and the copied preview must stay visually in parity with production."
