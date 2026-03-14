import { CoachNotFoundError } from "@/lib/modules/coach/errors/coach.errors";
import type { ICoachRepository } from "@/lib/modules/coach/repositories/coach.repository";
import { ValidationError } from "@/lib/shared/kernel/errors";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type { ICoachSetupRepository } from "../repositories/coach-setup.repository";
import type { CoachSetupStatus } from "../shared";
import {
  computeCoachLocationReady,
  computeCoachPaymentReady,
  computeCoachPricingReady,
  computeCoachProfileReady,
  computeCoachScheduleReady,
  computeCoachSportsReady,
} from "../shared";

type SubmitCoachVerificationResult = Pick<
  CoachSetupStatus,
  "coachId" | "verificationStatus" | "hasVerification"
>;

export class SubmitCoachVerificationUseCase {
  constructor(
    private readonly coachRepository: ICoachRepository,
    private readonly coachSetupRepository: ICoachSetupRepository,
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(userId: string): Promise<SubmitCoachVerificationResult> {
    return this.transactionManager.run(async (tx) => {
      const ctx = { tx };
      const existingCoach = await this.coachRepository.findByUserId(
        userId,
        ctx,
      );

      if (!existingCoach) {
        throw new ValidationError(
          "Create your coach profile before requesting verification",
        );
      }

      const lockedCoach = await this.coachRepository.findByIdForUpdate(
        existingCoach.id,
        ctx,
      );
      if (!lockedCoach) {
        throw new CoachNotFoundError(existingCoach.id);
      }

      if (lockedCoach.verificationStatus === "VERIFIED") {
        return {
          coachId: lockedCoach.id,
          verificationStatus: "VERIFIED",
          hasVerification: true,
        };
      }

      if (lockedCoach.verificationStatus === "PENDING") {
        return {
          coachId: lockedCoach.id,
          verificationStatus: "PENDING",
          hasVerification: false,
        };
      }

      const snapshot =
        await this.coachSetupRepository.findSetupSnapshotByUserId(userId, ctx);
      if (!snapshot) {
        throw new CoachNotFoundError(existingCoach.id);
      }

      const prerequisitesMet =
        computeCoachProfileReady(snapshot) &&
        computeCoachSportsReady(snapshot) &&
        computeCoachLocationReady(snapshot) &&
        computeCoachScheduleReady(snapshot) &&
        computeCoachPricingReady(snapshot) &&
        computeCoachPaymentReady(snapshot);

      if (!prerequisitesMet) {
        throw new ValidationError(
          "Complete profile, sports, location, schedule, pricing, and payment before requesting verification",
        );
      }

      const details = await this.coachRepository.findWithDetails(
        lockedCoach.id,
        ctx,
      );
      if (!details) {
        throw new CoachNotFoundError(lockedCoach.id);
      }

      const hasCertification = details.certifications.some(
        (certification) =>
          certification.name.trim().length > 0 &&
          (certification.issuingBody?.trim().length ?? 0) > 0,
      );

      if (!hasCertification) {
        throw new ValidationError(
          "Add at least one certification with an issuing body before requesting verification",
        );
      }

      await this.coachRepository.update(
        lockedCoach.id,
        {
          verificationStatus: "PENDING",
          verificationSubmittedAt: new Date(),
          verifiedAt: null,
        },
        ctx,
      );

      return {
        coachId: lockedCoach.id,
        verificationStatus: "PENDING",
        hasVerification: false,
      };
    });
  }
}
