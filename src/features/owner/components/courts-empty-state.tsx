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
import { appRoutes } from "@/shared/lib/app-routes";

export function CourtsEmptyState() {
  return (
    <Empty className="border rounded-lg py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MapPin />
        </EmptyMedia>
        <EmptyTitle>No courts yet</EmptyTitle>
        <EmptyDescription>
          Create a place and add courts to start accepting bookings
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-col items-center gap-3">
          <Button asChild>
            <Link href={appRoutes.owner.places.new}>
              <Plus className="mr-2 h-4 w-4" />
              Create a Place
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">- or -</span>
          <Button variant="outline" asChild>
            <Link href={appRoutes.owner.courts.new}>
              <Tag className="mr-2 h-4 w-4" />
              Add a Court
            </Link>
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
