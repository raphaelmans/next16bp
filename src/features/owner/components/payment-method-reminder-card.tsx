"use client";

import { CreditCard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PaymentMethodReminderCardProps {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  className?: string;
}

export function PaymentMethodReminderCard({
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: PaymentMethodReminderCardProps) {
  return (
    <Card className={cn("border-dashed bg-muted/30", className)}>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CreditCard className="h-4 w-4" />
            </span>
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
