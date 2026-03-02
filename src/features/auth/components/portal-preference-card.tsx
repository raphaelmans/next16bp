"use client";

import { Building2, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMutSetDefaultPortal,
  useQueryAuthUserPreference,
} from "@/features/auth/hooks";
import { cn } from "@/lib/utils";

type PortalDefault = "player" | "organization";

interface PortalPreferenceCardProps {
  id?: string;
  className?: string;
}

const portalOptions: Array<{
  value: PortalDefault;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: "player",
    title: "Player",
    description: "Open to player home and discovery by default.",
    icon: Home,
  },
  {
    value: "organization",
    title: "Organization",
    description: "Open to organization dashboard and operations by default.",
    icon: Building2,
  },
];

export function PortalPreferenceCard({
  id,
  className,
}: PortalPreferenceCardProps) {
  const router = useRouter();
  const query = useQueryAuthUserPreference(true);
  const radioIdPrefix = React.useId();

  const mutation = useMutSetDefaultPortal({
    onSuccess: (_data, variables) => {
      document.cookie = `kudos.portal-context=${variables.defaultPortal}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
      toast.success("Default portal updated");
    },
    onError: (error) => {
      toast.error("Could not save default portal", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    },
  });

  const selectedPortal = query.data?.defaultPortal ?? "player";

  const handleChange = (value: string) => {
    if (value !== "player" && value !== "organization") return;
    if (value === selectedPortal) return;
    mutation.mutate({ defaultPortal: value });
  };

  if (query.isLoading) {
    return (
      <Card id={id} className={className}>
        <CardHeader>
          <CardTitle>Default Portal</CardTitle>
          <CardDescription>
            Choose which view opens when you launch the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id={id} className={className}>
      <CardHeader>
        <CardTitle>Default Portal</CardTitle>
        <CardDescription>
          Choose which view opens when you launch the app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedPortal}
          onValueChange={handleChange}
          className="grid gap-3 sm:grid-cols-2"
          aria-label="Default portal"
        >
          {portalOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedPortal === option.value;
            const inputId = `${radioIdPrefix}-${option.value}`;

            return (
              <label
                key={option.value}
                htmlFor={inputId}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/40",
                  mutation.isPending && "opacity-80",
                )}
              >
                <RadioGroupItem
                  id={inputId}
                  value={option.value}
                  disabled={mutation.isPending}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-heading font-semibold">
                    <Icon className="h-4 w-4" />
                    <span>{option.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </label>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
