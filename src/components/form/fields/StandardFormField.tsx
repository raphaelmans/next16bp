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
import { cn } from "@/lib/utils";
import { useStandardFormContext } from "../context";
import type { FormLayout, StandardFormFieldProps } from "../types";

const layoutStyles: Record<FormLayout, string> = {
  vertical: "flex flex-col space-y-2",
  horizontal:
    "flex flex-row items-center gap-4 [&>label]:w-[200px] [&>label]:text-right",
  inline: "",
};

export function StandardFormField<
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
  children,
}: StandardFormFieldProps<TFieldValues, TName>) {
  const { control } = useFormContext<TFieldValues>();
  const { layout: providerLayout } = useStandardFormContext();
  const layout = layoutOverride ?? providerLayout;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(layoutStyles[layout], className)}>
          {label && layout !== "inline" && (
            <FormLabel>
              {label}
              {required && <span className="ml-1 text-destructive">*</span>}
            </FormLabel>
          )}
          <div className="flex-1">
            <FormControl>
              {typeof children === "function"
                ? children({ field, disabled })
                : children}
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}
