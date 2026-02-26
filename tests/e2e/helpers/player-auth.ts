import { expect, type Page } from "@playwright/test";

const PLAYER_EMAIL = process.env.E2E_PLAYER_EMAIL;
const PLAYER_PASSWORD = process.env.E2E_PLAYER_PASSWORD;
const PLAYER_VENUE_SLUG = process.env.E2E_PLAYER_VENUE_SLUG ?? "testerz";

export const hasPlayerCredentials =
  Boolean(PLAYER_EMAIL) && Boolean(PLAYER_PASSWORD);

export function getPlayerVenueSlug(): string {
  return PLAYER_VENUE_SLUG;
}

export async function loginAsPlayerAtVenue(page: Page): Promise<void> {
  if (!PLAYER_EMAIL || !PLAYER_PASSWORD) {
    throw new Error(
      "Missing E2E player credentials. Set E2E_PLAYER_EMAIL and E2E_PLAYER_PASSWORD.",
    );
  }

  const redirectTarget = `/venues/${PLAYER_VENUE_SLUG}`;
  await page.goto(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
  await page.waitForLoadState("domcontentloaded");

  const emailInput = page.getByRole("textbox", { name: /email/i });
  if ((await emailInput.count()) > 0) {
    const emailInput = page.getByRole("textbox", { name: /email/i });
    const passwordInput = page.getByRole("textbox", { name: /password/i });
    const signInButton = page.getByRole("button", { name: "Sign In" });

    await expect(emailInput).toBeVisible();
    await emailInput.fill(PLAYER_EMAIL);
    await passwordInput.fill(PLAYER_PASSWORD);
    await emailInput.blur();
    await passwordInput.blur();
    await expect(signInButton).toBeEnabled();
    await signInButton.click();
  }

  await page.waitForURL(new RegExp(`/venues/${PLAYER_VENUE_SLUG}`));
  await expect(
    page
      .getByRole("button", {
        name: /Continue to review|Reserve Now|Select a time|Select a time slot/i,
      })
      .first(),
  ).toBeVisible();
}
