"use client";

import type {
  FieldValues,
  SubmitErrorHandler,
  UseFormReturn,
} from "react-hook-form";
import { FormProvider } from "react-hook-form";
import { cn } from "@/lib/utils";
import { StandardFormContext } from "./context";
import type { FormLayout } from "./types";

interface StandardFormProviderProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>;
  onSubmit: (data: TFieldValues) => void | Promise<void>;
  onError?: SubmitErrorHandler<TFieldValues>;
  children: React.ReactNode;
  className?: string;
  layout?: FormLayout;
}

export function StandardFormProvider<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  onError,
  children,
  className,
  layout = "vertical",
}: StandardFormProviderProps<TFieldValues>) {
  return (
    <StandardFormContext.Provider value={{ layout }}>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onError)}
          className={cn("w-full space-y-4", className)}
        >
          {children}
        </form>
      </FormProvider>
    </StandardFormContext.Provider>
  );
}
