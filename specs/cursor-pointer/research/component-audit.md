# Component Audit — cursor-pointer

## Current State
Zero shadcn-ui components in `src/components/ui/` currently have `cursor-pointer`.

## Clickable Components Needing `cursor-pointer`

### Tier 1: Primary interactive controls (directly clicked by users)
| Component | File | Target sub-component | Notes |
|-----------|------|---------------------|-------|
| Button | button.tsx | `buttonVariants` base | CVA base string |
| Checkbox | checkbox.tsx | `CheckboxPrimitive.Root` | Has `disabled:cursor-not-allowed` already |
| Switch | switch.tsx | `SwitchPrimitive.Root` | Has `disabled:cursor-not-allowed` already |
| Toggle | toggle.tsx | `toggleVariants` base | CVA base string, also used by ToggleGroupItem |
| RadioGroupItem | radio-group.tsx | `RadioGroupPrimitive.Item` | Has `disabled:cursor-not-allowed` already |
| SelectTrigger | select.tsx | `SelectPrimitive.Trigger` | Has `disabled:cursor-not-allowed` already |
| TabsTrigger | tabs.tsx | `TabsPrimitive.Trigger` | Direct className |
| Slider thumb | slider.tsx | `SliderPrimitive.Thumb` | Block element |

### Tier 2: Menu/dropdown items (clicked within open menus)
| Component | File | Target sub-component | Notes |
|-----------|------|---------------------|-------|
| DropdownMenuItem | dropdown-menu.tsx | Item | Has `cursor-default` — change to `cursor-pointer` |
| DropdownMenuCheckboxItem | dropdown-menu.tsx | CheckboxItem | Has `cursor-default` — change |
| DropdownMenuRadioItem | dropdown-menu.tsx | RadioItem | Has `cursor-default` — change |
| DropdownMenuSubTrigger | dropdown-menu.tsx | SubTrigger | Has `cursor-default` — change |
| ContextMenuItem | context-menu.tsx | Item | Has `cursor-default` — change |
| ContextMenuCheckboxItem | context-menu.tsx | CheckboxItem | Has `cursor-default` — change |
| ContextMenuRadioItem | context-menu.tsx | RadioItem | Has `cursor-default` — change |
| ContextMenuSubTrigger | context-menu.tsx | SubTrigger | Has `cursor-default` — change |
| MenubarItem | menubar.tsx | Item | Has `cursor-default` — change |
| MenubarCheckboxItem | menubar.tsx | CheckboxItem | Has `cursor-default` — change |
| MenubarRadioItem | menubar.tsx | RadioItem | Has `cursor-default` — change |
| MenubarTrigger | menubar.tsx | Trigger | No cursor class |
| MenubarSubTrigger | menubar.tsx | SubTrigger | Has `cursor-default` — change |
| SelectItem | select.tsx | Item | Has `cursor-default` — change |

### Tier 3: Triggers (open dialogs/popovers/sheets)
These pass-through components don't have className — they use `asChild` and inherit from the child. Adding cursor-pointer here is unnecessary since they typically wrap a Button.
- DialogTrigger, SheetTrigger, PopoverTrigger, AlertDialogTrigger, CollapsibleTrigger, DropdownMenuTrigger, ContextMenuTrigger

### Tier 4: Close buttons and special actions
| Component | File | Notes |
|-----------|------|-------|
| Dialog close (X) | dialog.tsx | Inline close button in DialogContent |
| Sheet close (X) | sheet.tsx | Inline close button in SheetContent |
| AccordionTrigger | accordion.tsx | Direct className |
| NavigationMenuTrigger | navigation-menu.tsx | CVA style |
| NavigationMenuLink | navigation-menu.tsx | Direct className |
| BreadcrumbLink | breadcrumb.tsx | Direct className |
| PaginationLink | pagination.tsx | Uses buttonVariants — inherits from Button |
| SidebarMenuButton | sidebar.tsx | CVA base string |
| SidebarMenuAction | sidebar.tsx | Direct className |
| SidebarGroupAction | sidebar.tsx | Direct className |
| SidebarRail | sidebar.tsx | Already has specific cursor classes (resize) — skip |
| SidebarMenuSubButton | sidebar.tsx | Direct className |

### Not clickable (skip)
- Calendar: DayButton uses `<Button>` — inherits cursor from Button fix
- Carousel: Previous/Next use `<Button>` — inherits
- AlertDialogAction/Cancel: use `<Button asChild>` — inherits
- SidebarTrigger: uses `<Button>` — inherits
- Input, Textarea, InputOTP: text input, not click targets for cursor-pointer
- Drawer: uses vaul, no custom className on triggers
- Collapsible: trigger is pass-through, no className

## Pattern Summary
1. **Add `cursor-pointer`**: Button, Checkbox, Switch, Toggle, RadioGroupItem, SelectTrigger, TabsTrigger, SliderThumb, AccordionTrigger, NavigationMenuTrigger, NavigationMenuLink, BreadcrumbLink, Dialog close, Sheet close, SidebarMenuButton, SidebarMenuAction, SidebarGroupAction, SidebarMenuSubButton, MenubarTrigger
2. **Replace `cursor-default` with `cursor-pointer`**: All menu items (DropdownMenu, ContextMenu, Menubar), SelectItem, SelectScrollUpButton, SelectScrollDownButton
