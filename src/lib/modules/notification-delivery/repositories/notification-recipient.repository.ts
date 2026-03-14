import { eq, inArray } from "drizzle-orm";
import {
  claimRequest,
  coach,
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

export type PlayerRecipient = {
  userId: string;
  email: string | null;
  phoneNumber: string | null;
};

export type CoachRecipient = {
  coachId: string;
  userId: string;
  email: string | null;
  phoneNumber: string | null;
};

export type OrganizationRecipient = {
  organizationId: string;
  userId: string;
  email: string | null;
  phoneNumber: string | null;
};

export interface INotificationRecipientRepository {
  findAdminRecipients(ctx?: RequestContext): Promise<AdminRecipient[]>;
  findOwnerRecipientByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OwnerRecipient | null>;
  findPlayerRecipientByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<PlayerRecipient | null>;
  findCoachRecipientByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<CoachRecipient | null>;
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
  listOrganizationRecipientsByUserIds(
    organizationId: string,
    userIds: string[],
    ctx?: RequestContext,
  ): Promise<OrganizationRecipient[]>;
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

  async findPlayerRecipientByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<PlayerRecipient | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select({
        userId: profile.userId,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
      })
      .from(reservation)
      .innerJoin(profile, eq(profile.id, reservation.playerId))
      .where(eq(reservation.id, reservationId))
      .limit(1);

    const row = result[0];
    if (!row) return null;

    return {
      userId: row.userId,
      email: row.email ?? null,
      phoneNumber: row.phoneNumber ?? null,
    };
  }

  async findCoachRecipientByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<CoachRecipient | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select({
        coachId: coach.id,
        userId: coach.userId,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
      })
      .from(reservation)
      .innerJoin(coach, eq(coach.id, reservation.coachId))
      .leftJoin(profile, eq(profile.userId, coach.userId))
      .where(eq(reservation.id, reservationId))
      .limit(1);

    const row = result[0];
    if (!row) return null;

    return {
      coachId: row.coachId,
      userId: row.userId,
      email: row.email ?? null,
      phoneNumber: row.phoneNumber ?? null,
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

  async listOrganizationRecipientsByUserIds(
    organizationId: string,
    userIds: string[],
    ctx?: RequestContext,
  ): Promise<OrganizationRecipient[]> {
    if (userIds.length === 0) return [];

    const client = this.getClient(ctx);
    const rows = await client
      .select({
        userId: profile.userId,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
      })
      .from(profile)
      .where(inArray(profile.userId, userIds));

    const profileByUserId = new Map(
      rows.map((row) => [
        row.userId,
        { email: row.email ?? null, phoneNumber: row.phoneNumber ?? null },
      ]),
    );

    return userIds.map((userId) => {
      const contact = profileByUserId.get(userId);
      return {
        organizationId,
        userId,
        email: contact?.email ?? null,
        phoneNumber: contact?.phoneNumber ?? null,
      };
    });
  }
}
