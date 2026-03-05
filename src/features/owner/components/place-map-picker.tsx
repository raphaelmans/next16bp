"use client";

import {
  AdvancedMarker,
  APIProvider,
  Map,
  type MapMouseEvent,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import { MapPin, Pencil, Search } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useCallback, useId, useState } from "react";
import {
  type GoogleLocGeocodePlace,
  isApiClientError,
  useGoogleLocGeocodeMutation,
} from "@/common/clients/google-loc-client";
import { GoogleMapsEmbed } from "@/components/kudos/google-maps-embed";
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
  /** When false, hides the address search bar. Default: true */
  searchEnabled?: boolean;
}

export function PlaceMapPicker({
  latitude,
  longitude,
  onChange,
  searchEnabled = true,
}: PlaceMapPickerProps) {
  const apiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const [isInteractive, setIsInteractive] = useState(false);

  const hasCoordinates = latitude !== undefined && longitude !== undefined;

  if (!apiKey) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Map picker unavailable — configure NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY.
      </div>
    );
  }

  if (!isInteractive) {
    return (
      <div className="space-y-2">
        {hasCoordinates ? (
          <GoogleMapsEmbed
            title="Venue location"
            lat={latitude}
            lng={longitude}
            className="h-72"
            allowInteraction={false}
          />
        ) : (
          <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No location set yet.
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setIsInteractive(true)}
        >
          <Pencil className="mr-2 h-3.5 w-3.5" />
          {hasCoordinates ? "Edit pin location" : "Set pin location"}
        </Button>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <MapPickerInner
        latitude={latitude}
        longitude={longitude}
        onChange={onChange}
        searchEnabled={searchEnabled}
      />
    </APIProvider>
  );
}

function MapPickerInner({
  latitude,
  longitude,
  onChange,
  searchEnabled = true,
}: PlaceMapPickerProps) {
  const map = useMap();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchInputId = useId();

  const geocodeMutation = useGoogleLocGeocodeMutation();
  const searchResults = geocodeMutation.data?.results ?? [];

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
        geocodeMutation.reset();
      }
    },
    [onChange, geocodeMutation],
  );

  const handleSelectResult = useCallback(
    (result: GoogleLocGeocodePlace) => {
      onChange(result.lat, result.lng);
      map?.panTo({ lat: result.lat, lng: result.lng });
      map?.setZoom(PIN_ZOOM);
      geocodeMutation.reset();
    },
    [onChange, map, geocodeMutation],
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
            setSearchError(
              "No results found for that address in the Philippines.",
            );
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
      {searchEnabled && (
        <>
          <div className="flex gap-2">
            <Input
              id={searchInputId}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search address in the Philippines..."
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
                <Spinner className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {searchError && (
            <p className="text-xs text-destructive">{searchError}</p>
          )}

          {searchResults.length > 0 && (
            <div className="rounded-lg border border-border/60 bg-muted/20">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                Select a result
              </div>
              <div className="divide-y divide-border/40">
                {searchResults.map((result) => (
                  <button
                    key={`${result.lat}-${result.lng}`}
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>{result.formattedAddress}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

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
        {searchEnabled
          ? "Click on the map to drop a pin, or search for an address above."
          : "Click on the map to adjust the pin location."}
      </p>
    </div>
  );
}
