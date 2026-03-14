import {
  type Browser,
  type BrowserContext,
  expect,
  type Page,
  test,
} from "@playwright/test";
import {
  getCoachSlug,
  hasCoachCredentials,
  loginAsCoach,
} from "./helpers/coach-auth";
import {
  hasPlayerCredentials,
  loginAsPlayerAtCoach,
} from "./helpers/player-auth";

const e2eBaseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

async function createIsolatedPage(
  browser: Browser,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ baseURL: e2eBaseURL });
  const page = await context.newPage();

  return { context, page };
}

async function completePlayerProfileIfNeeded(page: Page): Promise<void> {
  const missingProfileAlert = page.getByText(
    "Please complete your profile before booking.",
  );

  if (
    (await missingProfileAlert.count()) === 0 ||
    !(await missingProfileAlert.first().isVisible())
  ) {
    return;
  }

  await page.getByRole("button", { name: "Edit" }).click();
  await expect(
    page.getByRole("dialog", { name: "Your Booking Profile" }),
  ).toBeVisible();

  await page.getByLabel("Display Name").fill("E2E Player");
  await page.getByLabel("Phone Number").fill("09123456789");
  await page.getByRole("button", { name: "Save & Continue" }).click();

  await expect(
    page.getByRole("dialog", { name: "Your Booking Profile" }),
  ).toHaveCount(0);
}

async function selectFirstAvailableCoachSlot(page: Page): Promise<void> {
  const calendarDays = page.locator(
    '[data-slot="calendar"] button[data-day]:not([disabled])',
  );
  const dayCount = await calendarDays.count();
  const visibleDaysToTry = Math.min(dayCount, 21);
  const slotButtons = page
    .getByRole("button")
    .filter({ hasText: /^\d{1,2}:\d{2}\s?(AM|PM)$/i });

  for (let i = 0; i < visibleDaysToTry; i += 1) {
    const dayButton = calendarDays.nth(i);
    if (!(await dayButton.isVisible())) {
      continue;
    }

    await dayButton.scrollIntoViewIfNeeded();
    await dayButton.click();
    await page.waitForTimeout(1_000);

    if ((await slotButtons.count()) === 0) {
      continue;
    }

    const firstSlot = slotButtons.first();
    if (!(await firstSlot.isVisible()) || !(await firstSlot.isEnabled())) {
      continue;
    }

    await firstSlot.click();
    return;
  }

  throw new Error(
    "No selectable coach slot found. Ensure the configured coach has availability in the next 21 days.",
  );
}

function getReservationId(url: string): string {
  const match = url.match(/\/reservations\/([^/?#]+)/);
  if (!match) {
    throw new Error(`Unable to extract reservation ID from URL: ${url}`);
  }

  return match[1];
}

test.describe("Coach booking happy path", () => {
  test.skip(
    !(hasPlayerCredentials && hasCoachCredentials),
    "Set E2E_PLAYER_EMAIL, E2E_PLAYER_PASSWORD, E2E_COACH_EMAIL, E2E_COACH_PASSWORD, and E2E_COACH_SLUG to run this suite.",
  );

  test("player books a coach session and coach accepts it", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const coachSlug = getCoachSlug();
    const playerActor = await createIsolatedPage(browser);
    const coachActor = await createIsolatedPage(browser);

    try {
      const { page: playerPage } = playerActor;
      const { page: coachPage } = coachActor;

      await loginAsPlayerAtCoach(playerPage, coachSlug);
      await expect(
        playerPage.getByRole("button", { name: "Book a session" }),
      ).toBeVisible();

      await playerPage.getByRole("button", { name: "Book a session" }).click();
      await playerPage.waitForURL(new RegExp(`/coaches/${coachSlug}/book`));
      await expect(
        playerPage.getByRole("heading", {
          level: 1,
          name: /Book a session with /i,
        }),
      ).toBeVisible();

      await selectFirstAvailableCoachSlot(playerPage);
      await completePlayerProfileIfNeeded(playerPage);

      const confirmBookingButton = playerPage.getByRole("button", {
        name: "Confirm Booking",
      });
      await expect(confirmBookingButton).toBeDisabled();
      await playerPage.locator("#terms").click();
      await expect(confirmBookingButton).toBeEnabled();
      await confirmBookingButton.click();

      await playerPage.waitForURL(/\/reservations\/[^/]+$/);
      const reservationId = getReservationId(playerPage.url());

      await expect(
        playerPage.locator(
          '[data-slot="kudos-status-badge"][data-status="CREATED"]',
        ),
      ).toBeVisible();
      await expect(
        playerPage.getByText("Coach session requested"),
      ).toBeVisible();
      await expect(
        playerPage.getByText("Coach review in progress."),
      ).toBeVisible();

      await loginAsCoach(coachPage);
      await coachPage.goto(`/coach/reservations/${reservationId}`);

      await expect(
        coachPage.getByRole("heading", {
          level: 1,
          name: "Reservation Details",
        }),
      ).toBeVisible();
      await expect(coachPage.getByText("Pending Review")).toBeVisible();
      await expect(
        coachPage.getByRole("button", { name: "Accept Booking" }),
      ).toBeVisible();

      await coachPage.getByRole("button", { name: "Accept Booking" }).click();

      await expect(coachPage.getByText("Awaiting Payment")).toBeVisible();
      await expect(coachPage.getByText("Awaiting payment proof")).toBeVisible();
      await expect(
        coachPage.getByText("Pending Review → Awaiting Payment"),
      ).toBeVisible();

      await playerPage.goto(`/reservations/${reservationId}`);
      await expect(
        playerPage.locator(
          '[data-slot="kudos-status-badge"][data-status="AWAITING_PAYMENT"]',
        ),
      ).toBeVisible();
      await expect(
        playerPage.getByText("Coach accepted (awaiting payment)"),
      ).toBeVisible();
      await expect(
        playerPage.getByText("Complete payment before the deadline."),
      ).toBeVisible();
    } finally {
      await Promise.all([
        playerActor.context.close(),
        coachActor.context.close(),
      ]);
    }
  });
});
