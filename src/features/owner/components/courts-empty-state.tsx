"use client";

import { MapPin, Tag } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
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
          Create a venue and add courts to start accepting bookings
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-col items-center gap-3">
          <Button asChild>
            <Link href={appRoutes.organization.courts.setupCreate}>
              <Tag className="mr-2 h-4 w-4" />
              Add a Court
            </Link>
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
