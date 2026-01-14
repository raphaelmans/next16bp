"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useStandardFormContext } from "../context";
import type { FormLayout, StandardFieldProps } from "../types";

const layoutStyles: Record<FormLayout, string> = {
  vertical: "flex items-center gap-3",
  horizontal:
    "flex flex-row items-center gap-4 [&>label]:w-[200px] [&>label]:text-right",
  inline: "flex items-center gap-3",
};

export function StandardFormSwitch<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  disabled,
  required,
  className,
  layout: layoutOverride,
}: StandardFieldProps<TFieldValues, TName>) {
  const { control } = useFormContext<TFieldValues>();
  const { layout: providerLayout } = useStandardFormContext();
  const layout = layoutOverride ?? providerLayout;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(layoutStyles[layout], className)}>
          <FormControl>
            <Switch
              checked={field.value === true}
              onCheckedChange={(value) => field.onChange(value === true)}
              disabled={disabled}
            />
          </FormControl>
          <div className="space-y-1">
            {label && (
              <FormLabel className="font-normal">
                {label}
                {required && <span className="ml-1 text-destructive">*</span>}
              </FormLabel>
            )}
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}
