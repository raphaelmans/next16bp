import { and, asc, eq, sql } from "drizzle-orm";
import {
  court,
  place,
  placeContactDetail,
  placePhoto,
  placeVerification,
  sport,
} from "@/lib/shared/infra/db/schema";
import type { DbClient } from "@/lib/shared/infra/db/types";

export interface PlaceListingEvidenceRow {
  placeId: string;
  placeType: "CURATED" | "RESERVABLE";
  organizationId: string | null;
  slug: string;
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  claimStatus: "UNCLAIMED" | "CLAIM_PENDING" | "CLAIMED" | "REMOVAL_REQUESTED";
  verificationStatus: string;
  activeCourtCount: number;
  activeCourtLabels: string[];
  activeSports: string[];
  photoCount: number;
  hasContactDetails: boolean;
}

export interface ListPlaceListingEvidenceOptions {
  limit: number | null;
  placeTypeFilter: "all" | "curated" | "org";
}

export interface IPlaceListingVerifierRepository {
  listPlaceEvidence(
    options: ListPlaceListingEvidenceOptions,
  ): Promise<PlaceListingEvidenceRow[]>;
}

export class PlaceListingVerifierRepository
  implements IPlaceListingVerifierRepository
{
  constructor(private readonly db: DbClient) {}

  async listPlaceEvidence(
    options: ListPlaceListingEvidenceOptions,
  ): Promise<PlaceListingEvidenceRow[]> {
    const conditions = [eq(place.isActive, true)];

    if (options.placeTypeFilter === "curated") {
      conditions.push(eq(place.placeType, "CURATED"));
    }

    if (options.placeTypeFilter === "org") {
      conditions.push(eq(place.placeType, "RESERVABLE"));
    }

    const rows = await this.db
      .select({
        placeId: place.id,
        placeType: place.placeType,
        organizationId: place.organizationId,
        slug: place.slug,
        name: place.name,
        address: place.address,
        city: place.city,
        province: place.province,
        country: place.country,
        claimStatus: place.claimStatus,
        verificationStatus:
          sql<string>`coalesce(max(${placeVerification.status}::text), 'NONE')`.as(
            "verification_status",
          ),
        activeCourtCount: sql<number>`count(distinct ${court.id})`.as(
          "active_court_count",
        ),
        activeCourtLabels:
          sql<string>`coalesce(string_agg(distinct ${court.label}, '|' order by ${court.label}), '')`.as(
            "active_court_labels",
          ),
        activeSports:
          sql<string>`coalesce(string_agg(distinct ${sport.slug}, '|' order by ${sport.slug}), '')`.as(
            "active_sports",
          ),
        photoCount: sql<number>`count(distinct ${placePhoto.id})`.as(
          "photo_count",
        ),
        hasContactDetails: sql<number>`max(case
            when ${placeContactDetail.phoneNumber} is not null
              or ${placeContactDetail.websiteUrl} is not null
              or ${placeContactDetail.facebookUrl} is not null
              or ${placeContactDetail.instagramUrl} is not null
              or ${placeContactDetail.viberInfo} is not null
              or ${placeContactDetail.otherContactInfo} is not null
            then 1
            else 0
          end)`.as("has_contact_details"),
      })
      .from(place)
      .leftJoin(
        court,
        and(eq(court.placeId, place.id), eq(court.isActive, true)),
      )
      .leftJoin(sport, eq(sport.id, court.sportId))
      .leftJoin(placePhoto, eq(placePhoto.placeId, place.id))
      .leftJoin(placeContactDetail, eq(placeContactDetail.placeId, place.id))
      .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
      .where(and(...conditions))
      .groupBy(
        place.id,
        place.placeType,
        place.organizationId,
        place.slug,
        place.name,
        place.address,
        place.city,
        place.province,
        place.country,
        place.claimStatus,
      )
      .orderBy(
        asc(place.placeType),
        asc(place.province),
        asc(place.city),
        asc(place.slug),
        asc(place.id),
      )
      .limit(options.limit ?? Number.MAX_SAFE_INTEGER);

    return rows.map((row) => ({
      placeId: row.placeId,
      placeType: row.placeType,
      organizationId: row.organizationId,
      slug: row.slug,
      name: row.name,
      address: row.address,
      city: row.city,
      province: row.province,
      country: row.country,
      claimStatus: row.claimStatus,
      verificationStatus: row.verificationStatus,
      activeCourtCount: Number(row.activeCourtCount ?? 0),
      activeCourtLabels: row.activeCourtLabels
        ? row.activeCourtLabels.split("|").filter(Boolean)
        : [],
      activeSports: row.activeSports
        ? row.activeSports.split("|").filter(Boolean)
        : [],
      photoCount: Number(row.photoCount ?? 0),
      hasContactDetails: Number(row.hasContactDetails ?? 0) > 0,
    }));
  }
}
