export type OwnerSetupGateInput = {
  isSetupComplete: boolean;
  hasPaymentMethod?: boolean;
  nextStep?: string;
} | null;

export function isOwnerSetupIncomplete(status: OwnerSetupGateInput): boolean {
  if (!status) return false;
  if (isOwnerPaymentMethodStepPending(status)) return true;
  if (status.nextStep === "complete") return false;
  if (typeof status.nextStep === "string") return true;
  return !status.isSetupComplete;
}

export function shouldShowOwnerGetStartedNav(input: {
  noOrgMode: boolean;
  setupStatusLoading: boolean;
  setupStatus: OwnerSetupGateInput;
}): boolean {
  if (input.noOrgMode) return true;
  if (input.setupStatusLoading) return true;
  if (!input.setupStatus) return true;
  return isOwnerSetupIncomplete(input.setupStatus);
}

export function isOwnerPaymentMethodStepPending(
  status: OwnerSetupGateInput,
): boolean {
  if (!status) return false;
  if (status.hasPaymentMethod === false) return true;
  return status.nextStep === "add_payment_method";
}
