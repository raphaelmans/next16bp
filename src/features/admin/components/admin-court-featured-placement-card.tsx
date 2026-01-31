"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminCourtFeaturedPlacementCardProps = {
  featuredRankInput: string;
  setFeaturedRankInput: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isUpdating: boolean;
};

export function AdminCourtFeaturedPlacementCard({
  featuredRankInput,
  setFeaturedRankInput,
  onSave,
  isSaving,
  isUpdating,
}: AdminCourtFeaturedPlacementCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Featured Placement</CardTitle>
        <CardDescription>
          Set the featured rank for landing page visibility.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-xs space-y-2">
          <Label htmlFor="featured-rank">Featured rank</Label>
          <Input
            id="featured-rank"
            value={featuredRankInput}
            onChange={(event) => setFeaturedRankInput(event.target.value)}
            inputMode="numeric"
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            Use 0 to remove featuring. Lower numbers are higher priority.
          </p>
        </div>
        <Button
          type="button"
          onClick={onSave}
          disabled={isSaving || isUpdating}
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save featured rank
        </Button>
      </CardContent>
    </Card>
  );
}
