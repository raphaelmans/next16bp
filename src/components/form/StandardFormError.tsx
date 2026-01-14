"use client";

import { AlertCircle } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface StandardFormErrorProps {
  className?: string;
}

export function StandardFormError({ className }: StandardFormErrorProps) {
  const {
    formState: { errors },
  } = useFormContext();

  const rootError = errors.root?.message as string | undefined;

  if (!rootError) return null;

  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{rootError}</AlertDescription>
    </Alert>
  );
}
