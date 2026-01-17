"use client";

import { MapPin } from "lucide-react";
import { EmptyState } from "@/shared/components/kudos";
import { appRoutes } from "@/shared/lib/app-routes";

interface EmptyResultsProps {
  query?: string;
  onClearFilters?: () => void;
}

export function EmptyResults({ query, onClearFilters }: EmptyResultsProps) {
  return (
    <EmptyState
      icon={MapPin}
      title="No courts found"
      description={
        query
          ? `We couldn't find any courts matching "${query}". Try adjusting your search or filters.`
          : "No courts match your current filters. Try adjusting your search criteria."
      }
      action={
        onClearFilters
          ? {
              label: "Clear filters",
              onClick: onClearFilters,
            }
          : {
              label: "Browse all courts",
              href: appRoutes.courts.base,
            }
      }
    />
  );
}
