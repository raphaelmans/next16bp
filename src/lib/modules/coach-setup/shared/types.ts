/**
 * Shared types for coach setup status determination.
 * Importable by both server and client — no side effects.
 */

export type CoachSetupNextStep =
  | "profile"
  | "sports"
  | "location"
  | "schedule"
  | "pricing"
  | "payment"
  | "verify"
  | "complete";

export type CoachSetupSnapshot = {
  coachId: string;
  name: string | null;
  tagline: string | null;
  bio: string | null;
  city: string | null;
  province: string | null;
  sportsCount: number;
  hoursCount: number;
  rateRuleCount: number;
  paymentMethodCount: number;
};

export type CoachSetupStatus = {
  coachId: string | null;
  hasCoachProfile: boolean;
  hasCoachSports: boolean;
  hasCoachLocation: boolean;
  hasCoachSchedule: boolean;
  hasCoachPricing: boolean;
  hasPaymentMethod: boolean;
  hasVerification: boolean;
  isSetupComplete: boolean;
  nextStep: CoachSetupNextStep;
};
