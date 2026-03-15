"use client";

import { ArrowRight, MapPin } from "lucide-react";
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

interface EmptyResultsProps {
  query?: string;
  onClearFilters?: () => void;
  alternativeHref?: string;
  alternativeLabel?: string;
}

export function EmptyResults({
  query,
  onClearFilters,
  alternativeHref,
  alternativeLabel,
}: EmptyResultsProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MapPin />
        </EmptyMedia>
        <EmptyTitle>No courts found</EmptyTitle>
        <EmptyDescription>
          {query
            ? `We couldn't find any courts matching "${query}". Try adjusting your search or filters.`
            : "No courts match your current filters. Try adjusting your search criteria."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onClearFilters ? (
            <Button variant="outline" onClick={onClearFilters}>
              Clear filters
            </Button>
          ) : (
            <Button asChild variant="outline">
              <a href={appRoutes.courts.base}>Browse all courts</a>
            </Button>
          )}
          {alternativeHref && alternativeLabel ? (
            <Button asChild variant="ghost">
              <Link href={alternativeHref}>
                {alternativeLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </EmptyContent>
    </Empty>
  );
}
