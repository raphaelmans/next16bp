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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useStandardFormContext } from "../context";
import type { FormLayout, StandardFieldProps } from "../types";

const layoutStyles: Record<FormLayout, string> = {
  vertical: "flex flex-col space-y-2",
  horizontal:
    "flex flex-row items-start gap-4 [&>label]:w-[200px] [&>label]:text-right",
  inline: "",
};

export function StandardFormTextarea<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  placeholder,
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
          {label && layout !== "inline" && (
            <FormLabel>
              {label}
              {required && <span className="ml-1 text-destructive">*</span>}
            </FormLabel>
          )}
          <div className="flex-1">
            <FormControl>
              <Textarea
                placeholder={layout === "inline" ? label : placeholder}
                disabled={disabled}
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
