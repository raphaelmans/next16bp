import { eq } from "drizzle-orm";
import {
  claimRequest,
  court,
  organization,
  organizationProfile,
  place,
  placeVerificationRequest,
  profile,
  reservation,
  userRoles,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export type AdminRecipient = {
  userId: string;
  email: string | null;
  phoneNumber: string | null;
};

export type OwnerRecipient = {
  organizationId: string;
  ownerUserId: string;
  email: string | null;
  phoneNumber: string | null;
};

export interface INotificationRecipientRepository {
  findAdminRecipients(ctx?: RequestContext): Promise<AdminRecipient[]>;
  findOwnerRecipientByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OwnerRecipient | null>;
  findOwnerRecipientByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<OwnerRecipient | null>;
  findOwnerRecipientByPlaceVerificationRequestId(
    placeVerificationRequestId: string,
    ctx?: RequestContext,
  ): Promise<OwnerRecipient | null>;
  findOwnerRecipientByClaimRequestId(
    claimRequestId: string,
    ctx?: RequestContext,
  ): Promise<OwnerRecipient | null>;
}

export class NotificationRecipientRepository
  implements INotificationRecipientRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findAdminRecipients(ctx?: RequestContext): Promise<AdminRecipient[]> {
    const client = this.getClient(ctx);
    const result = await client
      .select({
        userId: userRoles.userId,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
      })
      .from(userRoles)
      .leftJoin(profile, eq(profile.userId, userRoles.userId))
      .where(eq(userRoles.role, "admin"));

    return result.map((row) => ({
      userId: row.userId,
      email: row.email ?? null,
      phoneNumber: row.phoneNumber ?? null,
    }));
  }

  async findOwnerRecipientByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OwnerRecipient | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select({
        organizationId: organization.id,
        ownerUserId: organization.ownerUserId,
        orgContactEmail: organizationProfile.contactEmail,
        orgContactPhone: organizationProfile.contactPhone,
        ownerEmail: profile.email,
        ownerPhone: profile.phoneNumber,
      })
      .from(organization)
      .leftJoin(
        organizationProfile,
        eq(organizationProfile.organizationId, organization.id),
      )
      .leftJoin(profile, eq(profile.userId, organization.ownerUserId))
      .where(eq(organization.id, organizationId))
      .limit(1);

    const row = result[0];
    if (!row) return null;

    return {
      organizationId: row.organizationId,
      ownerUserId: row.ownerUserId,
      email: row.orgContactEmail ?? row.ownerEmail ?? null,
      phoneNumber: row.orgContactPhone ?? row.ownerPhone ?? null,
    };
  }

  async findOwnerRecipientByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<OwnerRecipient | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select({
        organizationId: organization.id,
        ownerUserId: organization.ownerUserId,
        orgContactEmail: organizationProfile.contactEmail,
        orgContactPhone: organizationProfile.contactPhone,
        ownerEmail: profile.email,
        ownerPhone: profile.phoneNumber,
      })
      .from(reservation)
      .innerJoin(court, eq(court.id, reservation.courtId))
      .innerJoin(place, eq(place.id, court.placeId))
      .innerJoin(organization, eq(organization.id, place.organizationId))
      .leftJoin(
        organizationProfile,
        eq(organizationProfile.organizationId, organization.id),
      )
      .leftJoin(profile, eq(profile.userId, organization.ownerUserId))
      .where(eq(reservation.id, reservationId))
      .limit(1);

    const row = result[0];
    if (!row) return null;

    return {
      organizationId: row.organizationId,
      ownerUserId: row.ownerUserId,
      email: row.orgContactEmail ?? row.ownerEmail ?? null,
      phoneNumber: row.orgContactPhone ?? row.ownerPhone ?? null,
    };
  }

  async findOwnerRecipientByPlaceVerificationRequestId(
    placeVerificationRequestId: string,
    ctx?: RequestContext,
  ): Promise<OwnerRecipient | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select({
        organizationId: organization.id,
        ownerUserId: organization.ownerUserId,
        orgContactEmail: organizationProfile.contactEmail,
        orgContactPhone: organizationProfile.contactPhone,
        ownerEmail: profile.email,
        ownerPhone: profile.phoneNumber,
      })
      .from(placeVerificationRequest)
      .innerJoin(
        organization,
        eq(organization.id, placeVerificationRequest.organizationId),
      )
      .leftJoin(
        organizationProfile,
        eq(organizationProfile.organizationId, organization.id),
      )
      .leftJoin(profile, eq(profile.userId, organization.ownerUserId))
      .where(eq(placeVerificationRequest.id, placeVerificationRequestId))
      .limit(1);

    const row = result[0];
    if (!row) return null;

    return {
      organizationId: row.organizationId,
      ownerUserId: row.ownerUserId,
      email: row.orgContactEmail ?? row.ownerEmail ?? null,
      phoneNumber: row.orgContactPhone ?? row.ownerPhone ?? null,
    };
  }

  async findOwnerRecipientByClaimRequestId(
    claimRequestId: string,
    ctx?: RequestContext,
  ): Promise<OwnerRecipient | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select({
        organizationId: organization.id,
        ownerUserId: organization.ownerUserId,
        orgContactEmail: organizationProfile.contactEmail,
        orgContactPhone: organizationProfile.contactPhone,
        ownerEmail: profile.email,
        ownerPhone: profile.phoneNumber,
      })
      .from(claimRequest)
      .innerJoin(organization, eq(organization.id, claimRequest.organizationId))
      .leftJoin(
        organizationProfile,
        eq(organizationProfile.organizationId, organization.id),
      )
      .leftJoin(profile, eq(profile.userId, organization.ownerUserId))
      .where(eq(claimRequest.id, claimRequestId))
      .limit(1);

    const row = result[0];
    if (!row) return null;

    return {
      organizationId: row.organizationId,
      ownerUserId: row.ownerUserId,
      email: row.orgContactEmail ?? row.ownerEmail ?? null,
      phoneNumber: row.orgContactPhone ?? row.ownerPhone ?? null,
    };
  }
}
