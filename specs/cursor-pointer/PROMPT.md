# Cursor Pointer — Add cursor-pointer to all clickable shadcn-ui components

## Objective
Add `cursor-pointer` to every clickable shadcn-ui component in `src/components/ui/` so users get consistent pointer feedback on hover.

## Key Requirements
- Add `cursor-pointer` to default classes of all clickable components (buttons, form controls, triggers, menu items, sidebar actions)
- Replace existing `cursor-default` with `cursor-pointer` in all menu item and select item components
- Leave disabled state cursor behavior unchanged (`disabled:cursor-not-allowed` and `disabled:pointer-events-none` stay as-is)
- Skip SidebarRail (has intentional resize cursors), text inputs, and pass-through triggers that use `asChild`
- Components using `<Button>` or `buttonVariants`/`toggleVariants` inherit automatically — do not double-add

## Spec Reference
Full design and component audit: `specs/cursor-pointer/design.md`
Implementation plan: `specs/cursor-pointer/plan.md`

## Acceptance Criteria

Given a user hovers over any Button, Checkbox, Switch, Toggle, RadioGroupItem, SelectTrigger, TabsTrigger, SliderThumb, AccordionTrigger, NavigationMenuTrigger, NavigationMenuLink, BreadcrumbLink, MenubarTrigger, dialog/sheet close button, or sidebar interactive element
When the cursor enters the element
Then the cursor changes to a pointer

Given a user hovers over any DropdownMenuItem, ContextMenuItem, MenubarItem, SelectItem (or their checkbox/radio/sub-trigger variants)
When the cursor enters the element
Then the cursor changes to a pointer (was `cursor-default`)

Given a component that internally uses `<Button>`, `buttonVariants`, or `toggleVariants` (CalendarDayButton, CarouselPrevious/Next, AlertDialogAction/Cancel, PaginationLink, ToggleGroupItem, SidebarTrigger)
When the cursor enters the element
Then the cursor changes to a pointer via inheritance

Given a disabled interactive element
When the cursor enters the element
Then the existing disabled cursor behavior is unchanged

## Validation
- `pnpm lint` passes
- `grep -r "cursor-default" src/components/ui/` returns zero results
- `grep -r "cursor-pointer" src/components/ui/` returns results for all 17 modified files
