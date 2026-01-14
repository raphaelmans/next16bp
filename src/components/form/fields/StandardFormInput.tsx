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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStandardFormContext } from "../context";
import type { FormLayout, StandardInputProps } from "../types";

const layoutStyles: Record<FormLayout, string> = {
  vertical: "flex flex-col space-y-2",
  horizontal:
    "flex flex-row items-center gap-4 [&>label]:w-[200px] [&>label]:text-right",
  inline: "",
};

const sizeStyles = {
  sm: "h-8 text-sm",
  default: "h-9",
  lg: "h-11 text-lg",
};

const variantStyles = {
  default: "",
  ghost: "border-transparent bg-transparent",
  outlined: "border border-input",
};

export function StandardFormInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  placeholder,
  disabled,
  required,
  type = "text",
  autoComplete,
  className,
  layout: layoutOverride,
  size = "default",
  variant = "default",
}: StandardInputProps<TFieldValues, TName>) {
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
              <Input
                type={type}
                placeholder={layout === "inline" ? label : placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                className={cn(sizeStyles[size], variantStyles[variant])}
                {...field}
              />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}
