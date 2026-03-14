import { expect, type Page } from "@playwright/test";

const PLAYER_EMAIL = process.env.E2E_PLAYER_EMAIL;
const PLAYER_PASSWORD = process.env.E2E_PLAYER_PASSWORD;
const PLAYER_VENUE_SLUG = process.env.E2E_PLAYER_VENUE_SLUG ?? "testerz";

export const hasPlayerCredentials =
  Boolean(PLAYER_EMAIL) && Boolean(PLAYER_PASSWORD);

export function getPlayerVenueSlug(): string {
  return PLAYER_VENUE_SLUG;
}

async function loginAsPlayer(
  page: Page,
  options: {
    redirectTarget: string;
    postLoginUrlPattern: RegExp;
    readyButtonName: RegExp;
  },
): Promise<void> {
  if (!PLAYER_EMAIL || !PLAYER_PASSWORD) {
    throw new Error(
      "Missing E2E player credentials. Set E2E_PLAYER_EMAIL and E2E_PLAYER_PASSWORD.",
    );
  }

  await page.goto(
    `/login?redirect=${encodeURIComponent(options.redirectTarget)}`,
  );
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

  await page.waitForURL(options.postLoginUrlPattern);
  await expect(
    page
      .getByRole("button", {
        name: options.readyButtonName,
      })
      .first(),
  ).toBeVisible();
}

export async function loginAsPlayerAtVenue(page: Page): Promise<void> {
  await loginAsPlayer(page, {
    redirectTarget: `/venues/${PLAYER_VENUE_SLUG}`,
    postLoginUrlPattern: new RegExp(`/venues/${PLAYER_VENUE_SLUG}`),
    readyButtonName:
      /Continue to review|Reserve Now|Select a time|Select a time slot/i,
  });
}

export async function loginAsPlayerAtCoach(
  page: Page,
  coachSlug: string,
): Promise<void> {
  await loginAsPlayer(page, {
    redirectTarget: `/coaches/${coachSlug}`,
    postLoginUrlPattern: new RegExp(`/coaches/${coachSlug}`),
    readyButtonName: /Book a session/i,
  });
}
