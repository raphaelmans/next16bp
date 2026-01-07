import type { RequestContext } from "@/shared/kernel/context";
import type { PaymentProofRecord } from "@/shared/infra/db/schema";
import type {
  IPaymentProofRepository,
  IReservationRepository,
  IProfileRepository,
} from "../repositories/payment-proof.repository";
import type { AddPaymentProofDTO, UpdatePaymentProofDTO } from "../dtos";
import {
  PaymentProofAlreadyExistsError,
  PaymentProofNotFoundError,
  ReservationNotFoundError,
  NotReservationOwnerError,
  InvalidReservationStatusError,
} from "../errors/payment-proof.errors";
import { logger } from "@/shared/infra/logger";

export interface IPaymentProofService {
  addPaymentProof(
    userId: string,
    data: AddPaymentProofDTO,
    ctx?: RequestContext,
  ): Promise<PaymentProofRecord>;
  updatePaymentProof(
    userId: string,
    data: UpdatePaymentProofDTO,
    ctx?: RequestContext,
  ): Promise<PaymentProofRecord>;
  getPaymentProof(
    userId: string,
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<PaymentProofRecord>;
}

// Allowed statuses for adding payment proof
const ALLOWED_STATUSES_FOR_PROOF = [
  "AWAITING_PAYMENT",
  "PAYMENT_MARKED_BY_USER",
];

export class PaymentProofService implements IPaymentProofService {
  constructor(
    private paymentProofRepository: IPaymentProofRepository,
    private reservationRepository: IReservationRepository,
    private profileRepository: IProfileRepository,
  ) {}

  async addPaymentProof(
    userId: string,
    data: AddPaymentProofDTO,
    ctx?: RequestContext,
  ): Promise<PaymentProofRecord> {
    // 1. Get reservation
    const reservation = await this.reservationRepository.findById(
      data.reservationId,
      ctx,
    );
    if (!reservation) {
      throw new ReservationNotFoundError(data.reservationId);
    }

    // 2. Verify ownership
    const profile = await this.profileRepository.findByUserId(userId, ctx);
    if (!profile || reservation.playerId !== profile.id) {
      throw new NotReservationOwnerError();
    }

    // 3. Verify status
    if (!ALLOWED_STATUSES_FOR_PROOF.includes(reservation.status)) {
      throw new InvalidReservationStatusError(
        `Cannot add payment proof for reservation in ${reservation.status} status`,
      );
    }

    // 4. Check existing
    const existing = await this.paymentProofRepository.findByReservationId(
      data.reservationId,
      ctx,
    );
    if (existing) {
      throw new PaymentProofAlreadyExistsError(data.reservationId);
    }

    // 5. Create
    const proof = await this.paymentProofRepository.create(
      {
        reservationId: data.reservationId,
        fileUrl: data.fileUrl,
        referenceNumber: data.referenceNumber,
        notes: data.notes,
      },
      ctx,
    );

    logger.info(
      {
        event: "payment_proof.added",
        reservationId: data.reservationId,
        proofId: proof.id,
        userId,
      },
      "Payment proof added",
    );

    return proof;
  }

  async updatePaymentProof(
    userId: string,
    data: UpdatePaymentProofDTO,
    ctx?: RequestContext,
  ): Promise<PaymentProofRecord> {
    // 1. Get reservation
    const reservation = await this.reservationRepository.findById(
      data.reservationId,
      ctx,
    );
    if (!reservation) {
      throw new ReservationNotFoundError(data.reservationId);
    }

    // 2. Verify ownership
    const profile = await this.profileRepository.findByUserId(userId, ctx);
    if (!profile || reservation.playerId !== profile.id) {
      throw new NotReservationOwnerError();
    }

    // 3. Verify proof exists
    const existing = await this.paymentProofRepository.findByReservationId(
      data.reservationId,
      ctx,
    );
    if (!existing) {
      throw new PaymentProofNotFoundError(data.reservationId);
    }

    // 4. Update
    const updateData: Record<string, unknown> = {};
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl;
    if (data.referenceNumber !== undefined)
      updateData.referenceNumber = data.referenceNumber;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await this.paymentProofRepository.update(
      existing.id,
      updateData,
      ctx,
    );

    logger.info(
      {
        event: "payment_proof.updated",
        reservationId: data.reservationId,
        proofId: existing.id,
        userId,
      },
      "Payment proof updated",
    );

    return updated;
  }

  async getPaymentProof(
    userId: string,
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<PaymentProofRecord> {
    // 1. Get reservation
    const reservation = await this.reservationRepository.findById(
      reservationId,
      ctx,
    );
    if (!reservation) {
      throw new ReservationNotFoundError(reservationId);
    }

    // 2. Verify access (player can view)
    // Note: In a full implementation, court owner access would be checked here
    const profile = await this.profileRepository.findByUserId(userId, ctx);
    const isPlayer = profile && reservation.playerId === profile.id;

    // For now, only player can view (court owner check would require additional dependencies)
    if (!isPlayer) {
      throw new NotReservationOwnerError();
    }

    // 3. Get proof
    const proof = await this.paymentProofRepository.findByReservationId(
      reservationId,
      ctx,
    );
    if (!proof) {
      throw new PaymentProofNotFoundError(reservationId);
    }

    return proof;
  }
}
