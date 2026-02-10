"use client";

import { ExternalLink, MapPin } from "lucide-react";
import { GoogleMapsEmbed } from "@/components/kudos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PlaceDetailLocationCardProps = {
  title?: string;
  placeName: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  mapQuery: string;
  directionsUrl: string;
  openInMapsUrl: string;
};

export function PlaceDetailLocationCard({
  title = "Location",
  placeName,
  lat,
  lng,
  placeId,
  mapQuery,
  directionsUrl,
  openInMapsUrl,
}: PlaceDetailLocationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <GoogleMapsEmbed
          title={`${placeName} location`}
          lat={lat}
          lng={lng}
          placeId={placeId}
          query={mapQuery}
          className="aspect-[16/9] w-full"
          allowInteraction={false}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            asChild
          >
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="mr-2 h-4 w-4" />
              Get Directions
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            asChild
          >
            <a href={openInMapsUrl} target="_blank" rel="noopener noreferrer">
              Open in Google Maps
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
