"use client";

import { MapPin } from "lucide-react";
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

interface EmptyResultsProps {
  query?: string;
  onClearFilters?: () => void;
}

export function EmptyResults({ query, onClearFilters }: EmptyResultsProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MapPin />
        </EmptyMedia>
        <EmptyTitle>No venues found</EmptyTitle>
        <EmptyDescription>
          {query
            ? `We couldn't find any venues matching "${query}". Try adjusting your search or filters.`
            : "No venues match your current filters. Try adjusting your search criteria."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {onClearFilters ? (
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : (
          <Button asChild variant="outline">
            <a href={appRoutes.courts.base}>Browse all courts</a>
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}
