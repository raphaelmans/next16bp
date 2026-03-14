import { expect, type Page } from "@playwright/test";

const COACH_EMAIL = process.env.E2E_COACH_EMAIL;
const COACH_PASSWORD = process.env.E2E_COACH_PASSWORD;
const COACH_SLUG = process.env.E2E_COACH_SLUG;

export const hasCoachCredentials =
  Boolean(COACH_EMAIL) && Boolean(COACH_PASSWORD) && Boolean(COACH_SLUG);

export function getCoachSlug(): string {
  if (!COACH_SLUG) {
    throw new Error("Missing E2E coach target. Set E2E_COACH_SLUG.");
  }

  return COACH_SLUG;
}

export async function loginAsCoach(page: Page): Promise<void> {
  if (!COACH_EMAIL || !COACH_PASSWORD) {
    throw new Error(
      "Missing E2E coach credentials. Set E2E_COACH_EMAIL and E2E_COACH_PASSWORD.",
    );
  }

  const redirectTarget = "/coach/reservations";
  await page.goto(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
  await page.waitForLoadState("domcontentloaded");

  const emailInput = page.getByRole("textbox", { name: /email/i });
  if ((await emailInput.count()) > 0) {
    const passwordInput = page.getByRole("textbox", { name: /password/i });
    const signInButton = page.getByRole("button", { name: "Sign In" });

    await expect(emailInput).toBeVisible();
    await emailInput.fill(COACH_EMAIL);
    await passwordInput.fill(COACH_PASSWORD);
    await emailInput.blur();
    await passwordInput.blur();
    await expect(signInButton).toBeEnabled();
    await signInButton.click();
  }

  await page.waitForURL(/\/coach\/reservations/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Reservations" }),
  ).toBeVisible();
}
