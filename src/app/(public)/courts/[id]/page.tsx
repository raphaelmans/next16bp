"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  MapPin,
  Wifi,
  Car,
  Lightbulb,
  Droplets,
  ShowerHead,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/shared/components/layout";
import { AdBanner } from "@/shared/components/kudos";
import {
  PhotoGallery,
  BookingCard,
  ContactSection,
} from "@/features/discovery/components";
import { useCourtDetail, useAvailableSlots } from "@/features/discovery/hooks";
import type { TimeSlot } from "@/shared/components/kudos";

const AMENITY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  parking: Car,
  wifi: Wifi,
  lights: Lightbulb,
  water: Droplets,
  restrooms: ShowerHead,
};

export default function CourtDetailPage() {
  const params = useParams();
  const courtId = params.id as string;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>();

  const { data: court, isLoading } = useCourtDetail({ courtId });
  const { data: slots = [], isLoading: isLoadingSlots } = useAvailableSlots({
    courtId,
    date: selectedDate,
  });

  if (isLoading) {
    return <CourtDetailSkeleton />;
  }

  if (!court) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Court not found</h1>
          <p className="text-muted-foreground mt-2">
            The court you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link
            href="/courts"
            className="text-primary hover:underline mt-4 inline-block"
          >
            Browse all courts
          </Link>
        </div>
      </Container>
    );
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlotId(slot.id);
  };

  return (
    <Container className="py-6">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/courts">Courts</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{court.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo Gallery */}
          <PhotoGallery photos={court.photos} courtName={court.name} />

          {/* Court Info */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {court.name}
                  </h1>
                  <Badge
                    variant={court.type === "CURATED" ? "contact" : "paid"}
                  >
                    {court.type === "CURATED" ? "Curated" : "Reservable"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span>{court.address}</span>
                </div>
              </div>
            </div>

            {court.description && (
              <p className="mt-4 text-muted-foreground">{court.description}</p>
            )}

            {/* Organization Link */}
            {court.organization && (
              <div className="mt-4">
                <Link
                  href={`/organizations/${court.organization.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Managed by {court.organization.name}
                </Link>
              </div>
            )}
          </div>

          {/* Amenities */}
          {court.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {court.amenities.map((amenity) => {
                    const Icon = AMENITY_ICONS[amenity.toLowerCase()] || MapPin;
                    return (
                      <div key={amenity} className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm capitalize">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Map Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Map integration coming soon</p>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(court.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-primary hover:underline text-sm"
              >
                Get Directions
              </a>
            </CardContent>
          </Card>

          {/* Ad Banner */}
          <AdBanner placement="court-detail" />
        </div>

        {/* Right Column - Booking Sidebar */}
        <div>
          {court.type === "RESERVABLE" ? (
            <BookingCard
              courtId={court.id}
              pricePerHourCents={court.pricePerHourCents}
              currency={court.currency}
              slots={slots}
              isLoadingSlots={isLoadingSlots}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              selectedSlotId={selectedSlotId}
              onSlotSelect={handleSlotSelect}
            />
          ) : (
            <ContactSection
              courtName={court.name}
              socialLinks={court.socialLinks || {}}
            />
          )}
        </div>
      </div>
    </Container>
  );
}

function CourtDetailSkeleton() {
  return (
    <Container className="py-6">
      <div className="h-6 w-48 bg-muted rounded animate-pulse mb-6" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-[16/9] bg-muted rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div>
          <div className="h-96 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    </Container>
  );
}
