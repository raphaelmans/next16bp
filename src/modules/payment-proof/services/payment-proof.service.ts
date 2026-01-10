import { v4 as uuidv4 } from "uuid";
import { STORAGE_BUCKETS } from "@/modules/storage/dtos";
import type { IObjectStorageService } from "@/modules/storage/services/object-storage.service";
import type { PaymentProofRecord } from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { AddPaymentProofDTO, UpdatePaymentProofDTO } from "../dtos";
import {
  InvalidReservationStatusError,
  NotReservationOwnerError,
  PaymentProofAlreadyExistsError,
  PaymentProofNotFoundError,
  ReservationNotFoundError,
} from "../errors/payment-proof.errors";
import type {
  IPaymentProofRepository,
  IProfileRepository,
  IReservationRepository,
} from "../repositories/payment-proof.repository";

export interface IPaymentProofService {
  addPaymentProof(
    userId: string,
    data: AddPaymentProofDTO,
    ctx?: RequestContext,
  ): Promise<PaymentProofRecord>;
  uploadPaymentProof(
    userId: string,
    reservationId: string,
    file: File,
    referenceNumber?: string,
    notes?: string,
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
    private storageService: IObjectStorageService,
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

  /**
   * Upload a payment proof image and create the record.
   * Uploads to storage first, then calls addPaymentProof.
   */
  async uploadPaymentProof(
    userId: string,
    reservationId: string,
    file: File,
    referenceNumber?: string,
    notes?: string,
  ): Promise<PaymentProofRecord> {
    // Validate reservation and ownership first (fail-fast)
    const reservation =
      await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new ReservationNotFoundError(reservationId);
    }

    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile || reservation.playerId !== profile.id) {
      throw new NotReservationOwnerError();
    }

    if (!ALLOWED_STATUSES_FOR_PROOF.includes(reservation.status)) {
      throw new InvalidReservationStatusError(
        `Cannot add payment proof for reservation in ${reservation.status} status`,
      );
    }

    // Check for existing proof
    const existing =
      await this.paymentProofRepository.findByReservationId(reservationId);
    if (existing) {
      throw new PaymentProofAlreadyExistsError(reservationId);
    }

    // Generate unique path: {reservationId}/{uuid}.{ext}
    const proofId = uuidv4();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${reservationId}/${proofId}.${ext}`;

    // Upload to storage
    const result = await this.storageService.upload({
      bucket: STORAGE_BUCKETS.PAYMENT_PROOFS,
      path,
      file,
      upsert: false,
    });

    // Create the proof record
    const proof = await this.paymentProofRepository.create({
      reservationId,
      fileUrl: result.url,
      referenceNumber,
      notes,
    });

    logger.info(
      {
        event: "payment_proof.uploaded",
        reservationId,
        proofId: proof.id,
        url: result.url,
        userId,
      },
      "Payment proof uploaded",
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
