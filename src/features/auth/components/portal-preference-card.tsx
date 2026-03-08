"use client";

import { Building2, Check, Home } from "lucide-react";
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
    description: "Player home and discovery",
    icon: Home,
  },
  {
    value: "organization",
    title: "Organization",
    description: "Dashboard and operations",
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
      // biome-ignore lint/suspicious/noDocumentCookie: setting portal preference cookie for server-side routing
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
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-[88px] w-full rounded-lg" />
          <Skeleton className="h-[88px] w-full rounded-lg" />
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
                  "relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 px-4 py-5 text-center transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-transparent bg-muted/30 hover:bg-muted/50",
                  mutation.isPending && "pointer-events-none opacity-70",
                )}
              >
                <RadioGroupItem
                  id={inputId}
                  value={option.value}
                  disabled={mutation.isPending}
                  className="sr-only"
                />
                {isSelected && (
                  <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-heading font-semibold">
                    {option.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
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
