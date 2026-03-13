"use client";

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
  provinceRankInput: string;
  setProvinceRankInput: (value: string) => void;
  onSaveFeaturedRank: () => void;
  onSaveProvinceRank: () => void;
  isSavingFeaturedRank: boolean;
  isSavingProvinceRank: boolean;
  isUpdating: boolean;
};

export function AdminCourtFeaturedPlacementCard({
  featuredRankInput,
  setFeaturedRankInput,
  provinceRankInput,
  setProvinceRankInput,
  onSaveFeaturedRank,
  onSaveProvinceRank,
  isSavingFeaturedRank,
  isSavingProvinceRank,
  isUpdating,
}: AdminCourtFeaturedPlacementCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Featured Placement</CardTitle>
        <CardDescription>
          Manage global and province-scoped ranking priorities.
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
            Global ranking for home and unfiltered discovery. Use 0 to disable.
          </p>
          <Button
            type="button"
            onClick={onSaveFeaturedRank}
            disabled={isSavingFeaturedRank || isUpdating}
            loading={isSavingFeaturedRank}
          >
            Save featured rank
          </Button>
        </div>
        <div className="max-w-xs space-y-2">
          <Label htmlFor="province-rank">Province rank</Label>
          <Input
            id="province-rank"
            value={provinceRankInput}
            onChange={(event) => setProvinceRankInput(event.target.value)}
            inputMode="numeric"
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            Province-scoped ranking for province-filtered discovery. Use 0 to
            disable.
          </p>
          <Button
            type="button"
            onClick={onSaveProvinceRank}
            disabled={isSavingProvinceRank || isUpdating}
            loading={isSavingProvinceRank}
          >
            Save province rank
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
