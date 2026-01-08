# Phase 1: Admin Components

**Dependencies:** None  
**Parallelizable:** Yes (all components independent)  
**User Stories:** US-02-03

---

## Objective

Create modular, reusable admin form components that can be used across all admin forms. These are simpler than the existing form components - focused on functionality over style.

---

## Directory Structure

```
src/features/admin/
├── components/
│   ├── index.ts                      # Re-export all components
│   ├── admin-sidebar.tsx             # Existing
│   ├── admin-navbar.tsx              # Existing
│   ├── admin-only.tsx                # Existing
│   ├── admin-input.tsx               # NEW
│   ├── admin-select.tsx              # NEW
│   ├── admin-textarea.tsx            # NEW
│   ├── admin-checkbox-group.tsx      # NEW
│   ├── admin-form-actions.tsx        # NEW
│   ├── admin-success-state.tsx       # NEW
│   └── admin-curated-court-form.tsx  # NEW (Phase 2)
└── schemas/
    ├── curated-court.schema.ts       # Existing
    └── curated-court-data-entry.schema.ts  # NEW
```

---

## Module 1A: Admin Form Components

### AdminInput

Simple labeled input with error display.

```typescript
// src/features/admin/components/admin-input.tsx
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function AdminInput({
  label,
  error,
  required,
  className,
  id,
  ...props
}: AdminInputProps) {
  const inputId = id || props.name;
  
  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={inputId}
        className={cn(error && "border-destructive", className)}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
```

### AdminSelect

Simple labeled select with error display.

```typescript
// src/features/admin/components/admin-select.tsx
"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AdminSelectProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export function AdminSelect({
  label,
  name,
  options,
  value,
  onChange,
  placeholder = "Select...",
  required,
  error,
  disabled,
}: AdminSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={name} className={cn(error && "border-destructive")}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
```

### AdminTextarea

Simple labeled textarea with error display.

```typescript
// src/features/admin/components/admin-textarea.tsx
"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AdminTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function AdminTextarea({
  label,
  error,
  required,
  className,
  id,
  ...props
}: AdminTextareaProps) {
  const textareaId = id || props.name;
  
  return (
    <div className="space-y-2">
      <Label htmlFor={textareaId}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Textarea
        id={textareaId}
        className={cn(error && "border-destructive", className)}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
```

### AdminCheckboxGroup

Checkbox group for multi-select options.

```typescript
// src/features/admin/components/admin-checkbox-group.tsx
"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface AdminCheckboxGroupProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  columns?: 2 | 3 | 4;
}

export function AdminCheckboxGroup({
  label,
  options,
  value,
  onChange,
  columns = 3,
}: AdminCheckboxGroupProps) {
  const handleChange = (option: string, checked: boolean) => {
    if (checked) {
      onChange([...value, option]);
    } else {
      onChange(value.filter((v) => v !== option));
    }
  };

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className={`grid gap-3 ${gridCols[columns]}`}>
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`checkbox-${option}`}
              checked={value.includes(option)}
              onCheckedChange={(checked) =>
                handleChange(option, checked === true)
              }
            />
            <Label
              htmlFor={`checkbox-${option}`}
              className="font-normal cursor-pointer"
            >
              {option}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Module 1B: Admin UI Components

### AdminFormActions

Submit and cancel buttons for forms.

```typescript
// src/features/admin/components/admin-form-actions.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AdminFormActionsProps {
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function AdminFormActions({
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  isSubmitting = false,
  onCancel,
  showCancel = true,
}: AdminFormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-4">
      {showCancel && onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );
}
```

### AdminSuccessState

Success message with action buttons.

```typescript
// src/features/admin/components/admin-success-state.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface SuccessAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary";
}

interface AdminSuccessStateProps {
  title: string;
  message?: string;
  actions: SuccessAction[];
}

export function AdminSuccessState({
  title,
  message,
  actions,
}: AdminSuccessStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {message && (
        <p className="text-muted-foreground mb-6">{message}</p>
      )}
      <div className="flex gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || (index === 0 ? "default" : "outline")}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

---

## Schema: Data Entry Form

Simplified schema for data entry (lat/lng optional).

```typescript
// src/features/admin/schemas/curated-court-data-entry.schema.ts
import { z } from "zod";

export const CITIES = [
  "Makati",
  "BGC",
  "Pasig",
  "Quezon City",
  "Manila",
  "Taguig",
  "Mandaluyong",
  "San Juan",
  "Parañaque",
  "Las Piñas",
  "Muntinlupa",
  "Alabang",
];

export const AMENITIES = [
  "Parking",
  "Restrooms",
  "Lights",
  "Showers",
  "Locker Rooms",
  "Equipment Rental",
  "Pro Shop",
  "Seating Area",
  "Food/Drinks",
  "WiFi",
  "Air Conditioning",
  "Covered Courts",
];

// Default coordinates (Manila, Philippines)
export const DEFAULT_LATITUDE = "14.5995";
export const DEFAULT_LONGITUDE = "120.9842";

const optionalUrl = z
  .string()
  .url("Must be a valid URL")
  .optional()
  .or(z.literal(""));

const optionalDecimal = z
  .string()
  .refine((val) => val === "" || !isNaN(parseFloat(val)), {
    message: "Must be a valid decimal number",
  })
  .optional()
  .or(z.literal(""));

export const curatedCourtDataEntrySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be less than 200 characters"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  latitude: optionalDecimal,
  longitude: optionalDecimal,
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  viberContact: z
    .string()
    .max(100, "Viber contact must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  websiteUrl: optionalUrl,
  otherContactInfo: z.string().optional(),
  amenities: z.array(z.string()).default([]),
});

export type CuratedCourtDataEntryFormData = z.infer<
  typeof curatedCourtDataEntrySchema
>;
```

---

## Update Index Exports

```typescript
// src/features/admin/components/index.ts
export { AdminNavbar } from "./admin-navbar";
export { AdminSidebar } from "./admin-sidebar";
export { AdminOnly } from "./admin-only";

// New admin form components
export { AdminInput } from "./admin-input";
export { AdminSelect } from "./admin-select";
export { AdminTextarea } from "./admin-textarea";
export { AdminCheckboxGroup } from "./admin-checkbox-group";
export { AdminFormActions } from "./admin-form-actions";
export { AdminSuccessState } from "./admin-success-state";
```

---

## Testing Checklist

### AdminInput
- [ ] Renders label correctly
- [ ] Shows required asterisk when required=true
- [ ] Shows error message when error prop provided
- [ ] Applies error styling to input border

### AdminSelect
- [ ] Renders label correctly
- [ ] Shows all options
- [ ] Calls onChange with selected value
- [ ] Shows error message when error prop provided

### AdminTextarea
- [ ] Renders label correctly
- [ ] Shows required asterisk when required=true
- [ ] Shows error message when error prop provided

### AdminCheckboxGroup
- [ ] Renders all options
- [ ] Correctly toggles checked state
- [ ] Calls onChange with updated array
- [ ] Respects columns prop

### AdminFormActions
- [ ] Shows submit button
- [ ] Shows cancel button when showCancel=true
- [ ] Disables buttons when isSubmitting=true
- [ ] Shows loading spinner when isSubmitting=true

### AdminSuccessState
- [ ] Shows success icon
- [ ] Shows title and message
- [ ] Renders all action buttons
- [ ] Calls onClick handlers correctly

---

## Handoff Notes

- All components use existing shadcn/ui primitives
- No new dependencies required
- Components are ready for Phase 2 (Data Entry Form)
