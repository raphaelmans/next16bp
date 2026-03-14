import { describe, expect, it } from "vitest";
import type { ICoachSetupRepository } from "@/lib/modules/coach-setup/repositories/coach-setup.repository";
import { GetCoachSetupStatusUseCase } from "@/lib/modules/coach-setup/use-cases/get-coach-setup-status.use-case";

const TEST_USER_ID = "11111111-1111-4111-8111-111111111111";

const createRepository = (
  snapshot: Awaited<
    ReturnType<ICoachSetupRepository["findSetupSnapshotByUserId"]>
  >,
): ICoachSetupRepository => ({
  findSetupSnapshotByUserId: async () => snapshot,
});

describe("GetCoachSetupStatusUseCase", () => {
  it("returns the empty status when the user has no coach yet", async () => {
    const useCase = new GetCoachSetupStatusUseCase(createRepository(null));

    await expect(useCase.execute(TEST_USER_ID)).resolves.toEqual({
      coachId: null,
      hasCoachProfile: false,
      hasCoachSports: false,
      hasCoachLocation: false,
      hasCoachSchedule: false,
      hasCoachPricing: false,
      hasPaymentMethod: false,
      hasVerification: true,
      isSetupComplete: false,
      nextStep: "profile",
    });
  });

  it("advances to the first incomplete step for a partial coach profile", async () => {
    const useCase = new GetCoachSetupStatusUseCase(
      createRepository({
        coachId: "22222222-2222-4222-8222-222222222222",
        name: "Coach Alex",
        tagline: "Movement-first training",
        bio: "Helping players compete with confidence.",
        city: "Makati",
        province: "Metro Manila",
        sportsCount: 1,
        hoursCount: 0,
        rateRuleCount: 0,
        paymentMethodCount: 0,
      }),
    );

    await expect(useCase.execute(TEST_USER_ID)).resolves.toMatchObject({
      coachId: "22222222-2222-4222-8222-222222222222",
      hasCoachProfile: true,
      hasCoachSports: true,
      hasCoachLocation: true,
      hasCoachSchedule: false,
      hasCoachPricing: false,
      hasPaymentMethod: false,
      hasVerification: true,
      isSetupComplete: false,
      nextStep: "schedule",
    });
  });

  it("marks setup complete when every tracked requirement is satisfied", async () => {
    const useCase = new GetCoachSetupStatusUseCase(
      createRepository({
        coachId: "22222222-2222-4222-8222-222222222222",
        name: "Coach Alex",
        tagline: "Movement-first training",
        bio: "Helping players compete with confidence.",
        city: "Makati",
        province: "Metro Manila",
        sportsCount: 2,
        hoursCount: 4,
        rateRuleCount: 3,
        paymentMethodCount: 1,
      }),
    );

    await expect(useCase.execute(TEST_USER_ID)).resolves.toMatchObject({
      hasCoachProfile: true,
      hasCoachSports: true,
      hasCoachLocation: true,
      hasCoachSchedule: true,
      hasCoachPricing: true,
      hasPaymentMethod: true,
      hasVerification: true,
      isSetupComplete: true,
      nextStep: "complete",
    });
  });
});
