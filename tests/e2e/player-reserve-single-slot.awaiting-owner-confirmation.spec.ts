import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  getPlayerVenueSlug,
  hasPlayerCredentials,
  loginAsPlayerAtVenue,
} from "./helpers/player-auth";

const venueSlug = getPlayerVenueSlug();

async function clickFirstVisibleEnabled(locator: Locator): Promise<boolean> {
  const count = await locator.count();
  for (let i = 0; i < count; i += 1) {
    const candidate = locator.nth(i);
    if (await candidate.isEnabled()) {
      try {
        await candidate.scrollIntoViewIfNeeded();
        if (!(await candidate.isVisible())) {
          continue;
        }
        await candidate.click();
        return true;
      } catch {
        try {
          await candidate.click({ force: true });
          return true;
        } catch {
          // Try the next candidate if this one cannot be clicked.
        }
      }
    }
  }
  return false;
}

async function selectOneAvailableSlot(
  page: Page,
  currentVenueSlug: string,
): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await expect(page.getByRole("radio", { name: /Book/i })).toBeVisible();

  // Let availability widgets finish hydrating before slot lookup.
  await page.waitForTimeout(1500);

  const weekRadio = page.getByRole("radio", { name: "Week" });
  if ((await weekRadio.count()) > 0 && !(await weekRadio.isChecked())) {
    await weekRadio.click();
  }

  const pickCourtRadio = page.getByRole("radio", { name: "Pick a court" });
  if (
    (await pickCourtRadio.count()) > 0 &&
    !(await pickCourtRadio.isChecked())
  ) {
    await pickCourtRadio.click();
  }

  await clickFirstVisibleEnabled(
    page.getByRole("button", { name: /^Court\s+/i }),
  );

  await clickFirstVisibleEnabled(
    page.getByRole("button", { name: /Select a time/i }),
  );

  const trySelectSlotInCurrentView = async () => {
    return page.evaluate(() => {
      const buttons = Array.from(
        document.querySelectorAll<HTMLButtonElement>("button:not([disabled])"),
      );

      const isVisible = (el: HTMLElement) =>
        !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      const isSlotLike = (text: string) =>
        /\d+\s*(?:AM|PM)|₱\s*\d+/i.test(text);

      const candidate = buttons.find((button) => {
        const label = (
          button.getAttribute("aria-label") ||
          button.textContent ||
          ""
        ).trim();
        return isVisible(button) && isSlotLike(label);
      });

      if (!candidate) return false;
      candidate.click();
      return true;
    });
  };

  const dateButtons = page
    .getByRole("button")
    .filter({ hasText: /^(Thu|Fri|Sat)\s+\d+$/ });
  const dateCount = await dateButtons.count();

  let selected = await trySelectSlotInCurrentView();
  for (let i = 0; i < dateCount && !selected; i += 1) {
    const date = dateButtons.nth(i);
    if ((await date.isVisible()) && (await date.isEnabled())) {
      await date.click();
      await page.waitForTimeout(500);
      selected = await trySelectSlotInCurrentView();
    }
  }

  const continueButton = page.getByRole("button", {
    name: /Continue to review|Continue to checkout|Reserve Now/i,
  });
  const addToBookingButton = page.getByRole("button", {
    name: /Add to booking/i,
  });
  if (!selected) {
    throw new Error(
      `No selectable slot found for venue "${currentVenueSlug}". Ensure tester data has at least one available slot.`,
    );
  }
  if ((await addToBookingButton.count()) > 0 && (await addToBookingButton.isVisible())) {
    await addToBookingButton.click();
  }
  if ((await continueButton.count()) > 0 && (await continueButton.isVisible())) {
    await expect(continueButton).toBeEnabled({ timeout: 15_000 });
  }
}

test.describe("Player single-slot reservation", () => {
  test.skip(
    !hasPlayerCredentials,
    "Set E2E_PLAYER_EMAIL and E2E_PLAYER_PASSWORD to run this suite.",
  );

  test("booking lands in awaiting owner confirmation state", async ({
    page,
  }) => {
    await loginAsPlayerAtVenue(page);
    await page.goto(`/venues/${venueSlug}`);
    await selectOneAvailableSlot(page, venueSlug);

    let advancedToReview = await clickFirstVisibleEnabled(
      page.getByRole("button", {
        name: /Continue to review|Continue to checkout|Reserve Now/i,
      }),
    );
    if (!advancedToReview) {
      advancedToReview = await clickFirstVisibleEnabled(
        page.getByRole("button", { name: /Select a time/i }),
      );
    }
    expect(advancedToReview).toBeTruthy();

    await page.waitForURL(new RegExp(`/venues/${venueSlug}/book`));
    await expect(
      page.getByRole("button", { name: "Confirm Booking" }),
    ).toBeVisible();

    if ((await page.getByText("Set up your profile to confirm").count()) > 0) {
      await page.getByRole("button", { name: /Complete Profile/i }).click();
      await page.getByLabel("Display Name").fill("E2E Player");
      await page.getByLabel("Email").fill("raphael+4@kudoscourts.com");
      await page.getByRole("button", { name: "Save & Continue" }).click();
      await expect(
        page.getByText("Set up your profile to confirm"),
      ).toHaveCount(0);
    }

    const confirmBookingButton = page.getByRole("button", {
      name: "Confirm Booking",
    });
    await expect(confirmBookingButton).toBeDisabled();
    await page.locator("#terms").click();
    await expect(confirmBookingButton).toBeEnabled();
    await confirmBookingButton.click();

    await page.waitForURL(/\/reservations\/[^/]+$/);
    await expect(
      page.locator('[data-slot="kudos-status-badge"][data-status="CREATED"]'),
    ).toBeVisible();
    await expect(page.getByText("Owner review is in progress.")).toBeVisible();
    await expect(page.getByText("Reservation requested")).toBeVisible();
  });
});
