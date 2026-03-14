import { CoachNotFoundError } from "@/lib/modules/coach/errors/coach.errors";
import type { ICoachRepository } from "@/lib/modules/coach/repositories/coach.repository";
import type { IOrganizationRepository } from "@/lib/modules/organization/repositories/organization.repository";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type { CoachVenueRecord } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import {
  CoachVenueAlreadyLinkedError,
  CoachVenueInvalidStatusError,
  CoachVenueNotCoachError,
  CoachVenueNotFoundError,
  CoachVenueNotOwnerError,
} from "../errors/coach-venue.errors";
import type { ICoachVenueRepository } from "../repositories/coach-venue.repository";

export interface ICoachVenueService {
  inviteCoach(
    ownerUserId: string,
    coachId: string,
    placeId: string,
  ): Promise<CoachVenueRecord>;
  acceptInvitation(
    coachUserId: string,
    coachVenueId: string,
  ): Promise<CoachVenueRecord>;
  declineInvitation(
    coachUserId: string,
    coachVenueId: string,
  ): Promise<CoachVenueRecord>;
  removeFromVenue(
    userId: string,
    coachVenueId: string,
  ): Promise<CoachVenueRecord>;
  leaveVenue(
    coachUserId: string,
    coachVenueId: string,
  ): Promise<CoachVenueRecord>;
  listByVenue(placeId: string): Promise<CoachVenueRecord[]>;
  listMyVenues(coachUserId: string): Promise<CoachVenueRecord[]>;
  listPendingInvitations(coachUserId: string): Promise<CoachVenueRecord[]>;
}

export class CoachVenueService implements ICoachVenueService {
  constructor(
    private coachVenueRepository: ICoachVenueRepository,
    private coachRepository: ICoachRepository,
    private placeRepository: IPlaceRepository,
    private organizationRepository: IOrganizationRepository,
  ) {}

  async inviteCoach(
    ownerUserId: string,
    coachId: string,
    placeId: string,
  ): Promise<CoachVenueRecord> {
    // Validate place exists and caller is the owner
    const place = await this.placeRepository.findById(placeId);
    if (!place || !place.organizationId) {
      throw new CoachVenueNotOwnerError();
    }

    const organization = await this.organizationRepository.findById(
      place.organizationId,
    );
    if (!organization || organization.ownerUserId !== ownerUserId) {
      throw new CoachVenueNotOwnerError();
    }

    // Validate coach exists
    const coach = await this.coachRepository.findById(coachId);
    if (!coach) {
      throw new CoachNotFoundError(coachId);
    }

    // Check for existing active link (PENDING or ACCEPTED)
    const existing = await this.coachVenueRepository.findActiveByCoachAndPlace(
      coachId,
      placeId,
    );
    if (existing) {
      throw new CoachVenueAlreadyLinkedError(coachId, placeId);
    }

    const record = await this.coachVenueRepository.create({
      coachId,
      placeId,
      status: "PENDING",
      invitedByUserId: ownerUserId,
    });

    logger.info("coach_venue.invited", {
      coachVenueId: record.id,
      coachId,
      placeId,
      invitedByUserId: ownerUserId,
    });

    return record;
  }

  async acceptInvitation(
    coachUserId: string,
    coachVenueId: string,
  ): Promise<CoachVenueRecord> {
    const record = await this.findAndAuthorizeCoach(coachUserId, coachVenueId);

    if (record.status !== "PENDING") {
      throw new CoachVenueInvalidStatusError(
        record.status,
        "PENDING",
        coachVenueId,
      );
    }

    const updated = await this.coachVenueRepository.updateStatus(
      coachVenueId,
      "ACCEPTED",
    );

    logger.info("coach_venue.accepted", {
      coachVenueId,
      coachId: record.coachId,
      placeId: record.placeId,
    });

    if (!updated) {
      throw new CoachVenueNotFoundError(coachVenueId);
    }

    return updated;
  }

  async declineInvitation(
    coachUserId: string,
    coachVenueId: string,
  ): Promise<CoachVenueRecord> {
    const record = await this.findAndAuthorizeCoach(coachUserId, coachVenueId);

    if (record.status !== "PENDING") {
      throw new CoachVenueInvalidStatusError(
        record.status,
        "PENDING",
        coachVenueId,
      );
    }

    const updated = await this.coachVenueRepository.updateStatus(
      coachVenueId,
      "DECLINED",
    );

    logger.info("coach_venue.declined", {
      coachVenueId,
      coachId: record.coachId,
      placeId: record.placeId,
    });

    if (!updated) {
      throw new CoachVenueNotFoundError(coachVenueId);
    }

    return updated;
  }

  async removeFromVenue(
    userId: string,
    coachVenueId: string,
  ): Promise<CoachVenueRecord> {
    const record = await this.coachVenueRepository.findById(coachVenueId);
    if (!record) {
      throw new CoachVenueNotFoundError(coachVenueId);
    }

    if (record.status !== "ACCEPTED") {
      throw new CoachVenueInvalidStatusError(
        record.status,
        "ACCEPTED",
        coachVenueId,
      );
    }

    // Allow either the coach or the venue owner to remove
    const isCoach = await this.isUserCoach(userId, record.coachId);
    const isOwner = await this.isUserPlaceOwner(userId, record.placeId);

    if (!isCoach && !isOwner) {
      throw new CoachVenueNotOwnerError();
    }

    const updated = await this.coachVenueRepository.updateStatus(
      coachVenueId,
      "REMOVED",
    );

    logger.info("coach_venue.removed", {
      coachVenueId,
      coachId: record.coachId,
      placeId: record.placeId,
      removedByUserId: userId,
    });

    if (!updated) {
      throw new CoachVenueNotFoundError(coachVenueId);
    }

    return updated;
  }

  async leaveVenue(
    coachUserId: string,
    coachVenueId: string,
  ): Promise<CoachVenueRecord> {
    const record = await this.findAndAuthorizeCoach(coachUserId, coachVenueId);

    if (record.status !== "ACCEPTED") {
      throw new CoachVenueInvalidStatusError(
        record.status,
        "ACCEPTED",
        coachVenueId,
      );
    }

    const updated = await this.coachVenueRepository.updateStatus(
      coachVenueId,
      "REMOVED",
    );

    logger.info("coach_venue.left", {
      coachVenueId,
      coachId: record.coachId,
      placeId: record.placeId,
    });

    if (!updated) {
      throw new CoachVenueNotFoundError(coachVenueId);
    }

    return updated;
  }

  async listByVenue(placeId: string): Promise<CoachVenueRecord[]> {
    return this.coachVenueRepository.findAcceptedByPlaceId(placeId);
  }

  async listMyVenues(coachUserId: string): Promise<CoachVenueRecord[]> {
    const coach = await this.coachRepository.findByUserId(coachUserId);
    if (!coach) {
      return [];
    }
    return this.coachVenueRepository.findByCoachId(coach.id);
  }

  async listPendingInvitations(
    coachUserId: string,
  ): Promise<CoachVenueRecord[]> {
    const coach = await this.coachRepository.findByUserId(coachUserId);
    if (!coach) {
      return [];
    }
    return this.coachVenueRepository.findPendingByCoachId(coach.id);
  }

  private async findAndAuthorizeCoach(
    coachUserId: string,
    coachVenueId: string,
  ): Promise<CoachVenueRecord> {
    const record = await this.coachVenueRepository.findById(coachVenueId);
    if (!record) {
      throw new CoachVenueNotFoundError(coachVenueId);
    }

    const isCoach = await this.isUserCoach(coachUserId, record.coachId);
    if (!isCoach) {
      throw new CoachVenueNotCoachError();
    }

    return record;
  }

  private async isUserCoach(userId: string, coachId: string): Promise<boolean> {
    const coach = await this.coachRepository.findById(coachId);
    return coach !== null && coach.userId === userId;
  }

  private async isUserPlaceOwner(
    userId: string,
    placeId: string,
  ): Promise<boolean> {
    const place = await this.placeRepository.findById(placeId);
    if (!place || !place.organizationId) {
      return false;
    }
    const org = await this.organizationRepository.findById(
      place.organizationId,
    );
    return org !== null && org.ownerUserId === userId;
  }
}
