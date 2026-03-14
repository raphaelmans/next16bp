import type { CoachSetupStatus } from "../dtos";
import type { ICoachSetupRepository } from "../repositories/coach-setup.repository";
import {
  buildEmptyCoachSetupStatus,
  computeCoachLocationReady,
  computeCoachNextStep,
  computeCoachPaymentReady,
  computeCoachPricingReady,
  computeCoachProfileReady,
  computeCoachScheduleReady,
  computeCoachSportsReady,
  computeCoachVerificationReady,
} from "../shared";

export class GetCoachSetupStatusUseCase {
  constructor(private coachSetupRepository: ICoachSetupRepository) {}

  async execute(userId: string): Promise<CoachSetupStatus> {
    const snapshot =
      await this.coachSetupRepository.findSetupSnapshotByUserId(userId);

    if (!snapshot) {
      return buildEmptyCoachSetupStatus();
    }

    const hasCoachProfile = computeCoachProfileReady(snapshot);
    const hasCoachSports = computeCoachSportsReady(snapshot);
    const hasCoachLocation = computeCoachLocationReady(snapshot);
    const hasCoachSchedule = computeCoachScheduleReady(snapshot);
    const hasCoachPricing = computeCoachPricingReady(snapshot);
    const hasPaymentMethod = computeCoachPaymentReady(snapshot);
    const hasVerification = computeCoachVerificationReady(snapshot);

    const nextStep = computeCoachNextStep({
      hasCoachProfile,
      hasCoachSports,
      hasCoachLocation,
      hasCoachSchedule,
      hasCoachPricing,
      hasPaymentMethod,
      hasVerification,
    });

    return {
      coachId: snapshot.coachId,
      hasCoachProfile,
      hasCoachSports,
      hasCoachLocation,
      hasCoachSchedule,
      hasCoachPricing,
      hasPaymentMethod,
      hasVerification,
      verificationStatus: snapshot.verificationStatus,
      isSetupComplete: nextStep === "complete",
      nextStep,
    };
  }
}
