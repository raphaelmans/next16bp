"use client";

import { MapPin, Plus, Tag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function CourtsEmptyState() {
  return (
    <Empty className="border rounded-lg py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MapPin />
        </EmptyMedia>
        <EmptyTitle>No courts yet</EmptyTitle>
        <EmptyDescription>
          Add your first court to start accepting bookings
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-col items-center gap-3">
          <Button asChild>
            <Link href="/owner/courts/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Court
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">- or -</span>
          <Button variant="outline" asChild>
            <Link href="/courts">
              <Tag className="mr-2 h-4 w-4" />
              Claim an Existing Court
            </Link>
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
