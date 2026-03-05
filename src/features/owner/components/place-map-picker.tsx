"use client";

import { useCallback, useId, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { Loader2, Search } from "lucide-react";
import {
  isApiClientError,
  useGoogleLocGeocodeMutation,
} from "@/common/clients/google-loc-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { env } from "@/lib/env";

const PHILIPPINES_CENTER = { lat: 12.8797, lng: 121.774 };
const COUNTRY_ZOOM = 6;
const PIN_ZOOM = 15;

interface PlaceMapPickerProps {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number, lng: number) => void;
}

export function PlaceMapPicker({
  latitude,
  longitude,
  onChange,
}: PlaceMapPickerProps) {
  const apiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

  if (!apiKey) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Map picker unavailable — configure NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY.
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <MapPickerInner
        latitude={latitude}
        longitude={longitude}
        onChange={onChange}
      />
    </APIProvider>
  );
}

function MapPickerInner({
  latitude,
  longitude,
  onChange,
}: PlaceMapPickerProps) {
  const map = useMap();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchInputId = useId();

  const geocodeMutation = useGoogleLocGeocodeMutation({
    onSuccess: (data) => {
      onChange(data.lat, data.lng);
      map?.panTo({ lat: data.lat, lng: data.lng });
      map?.setZoom(PIN_ZOOM);
    },
  });

  const hasPin = latitude !== undefined && longitude !== undefined;
  const center = hasPin
    ? { lat: latitude, lng: longitude }
    : PHILIPPINES_CENTER;
  const zoom = hasPin ? PIN_ZOOM : COUNTRY_ZOOM;

  const handleMapClick = useCallback(
    (event: MapMouseEvent) => {
      const latLng = event.detail?.latLng;
      if (latLng) {
        onChange(latLng.lat, latLng.lng);
      }
    },
    [onChange],
  );

  const handleSearch = useCallback(() => {
    const query = searchQuery.trim();
    if (!query) return;

    setSearchError(null);
    geocodeMutation.mutate(
      { address: query },
      {
        onError: (error) => {
          if (isApiClientError(error) && error.httpStatus === 429) {
            setSearchError(
              "Too many searches. Please wait before trying again.",
            );
            return;
          }
          if (isApiClientError(error) && error.httpStatus === 400) {
            setSearchError("No results found for that address.");
            return;
          }
          setSearchError(
            "Could not find that address. Try a more specific query.",
          );
        },
      },
    );
  }, [searchQuery, geocodeMutation]);

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSearch();
      }
    },
    [handleSearch],
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={searchInputId}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search address..."
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleSearch}
          disabled={!searchQuery.trim() || geocodeMutation.isPending}
        >
          {geocodeMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {searchError && <p className="text-xs text-destructive">{searchError}</p>}

      <div className="h-72 overflow-hidden rounded-lg border">
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId="place-map-picker"
          onClick={handleMapClick}
          className="h-full w-full"
        >
          {hasPin && (
            <AdvancedMarker position={{ lat: latitude, lng: longitude }}>
              <Pin />
            </AdvancedMarker>
          )}
        </Map>
      </div>

      <p className="text-xs text-muted-foreground">
        Click on the map to drop a pin, or search for an address above.
      </p>
    </div>
  );
}
