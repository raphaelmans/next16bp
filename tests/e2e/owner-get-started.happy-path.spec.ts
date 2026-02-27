import { expect, type Page, test } from "@playwright/test";
import { hasOwnerCredentials, loginAsOwner } from "./helpers/auth-login";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function selectFirstOptionInField(
  page: Page,
  label: string,
): Promise<boolean> {
  const trigger = page.getByRole("combobox", { name: label }).first();
  if ((await trigger.count()) === 0) return false;
  await trigger.click();
  const option = page.getByRole("option").first();
  if ((await option.count()) === 0) {
    await page.keyboard.press("Escape");
    return false;
  }
  await option.click();
  return true;
}

async function isTextVisible(page: Page, text: string): Promise<boolean> {
  const locator = page.getByText(text).first();
  return (await locator.count()) > 0 && (await locator.isVisible());
}

/**
 * Navigate to a wizard step via URL.
 *
 * IMPORTANT: The wizard has an auto-skip hook that fires once per page load
 * when landing on `?step=org`. If org is already complete, navigating to
 * `?step=org` will auto-redirect to the first incomplete step. For the org
 * step specifically, navigate in-page via Back buttons instead.
 */
async function goToStep(page: Page, step: string) {
  await page.goto(`/owner/get-started?step=${step}`);
  await expect(page.getByText(/Step \d+ of 6/)).toBeVisible();
}

/** Click Back n times, waiting for step indicator to update each time. */
async function clickBackTimes(page: Page, times: number) {
  for (let i = 0; i < times; i++) {
    const currentStep = await page.getByText(/Step \d+ of 6/).textContent();
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByText(/Step \d+ of 6/)).not.toHaveText(
      currentStep ?? "",
    );
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Owner get-started happy path", () => {
  test.skip(
    !hasOwnerCredentials,
    "Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD to run this suite.",
  );

  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test("wizard loads and auto-skips to first incomplete step", async ({
    page,
  }) => {
    await expect(page.getByText(/Step \d+ of 6/)).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
  });

  test("org step shows complete state or creation form", async ({ page }) => {
    // loginAsOwner triggers auto-skip (org → first incomplete). hasFired is
    // now true, so navigating back to org via Back won't re-trigger auto-skip.
    const stepText = await page.getByText(/Step \d+ of 6/).textContent();
    const currentStepNum = Number(stepText?.match(/\d+/)?.[0]);
    const backsNeeded = currentStepNum - 1;

    if (backsNeeded > 0) {
      await clickBackTimes(page, backsNeeded);
    }

    await expect(page.getByText("Step 1 of 6")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Organization" }),
    ).toBeVisible();

    const orgComplete = await isTextVisible(page, "Organization created");

    if (orgComplete) {
      await expect(
        page.getByRole("button", { name: "Continue" }),
      ).toBeVisible();
    } else {
      await expect(page.getByLabel("Organization Name")).toBeVisible();
      await page.getByLabel("Organization Name").fill(`E2E Org ${Date.now()}`);
      await page.getByRole("button", { name: "Create Organization" }).click();
      await expect(page.getByText("Organization created")).toBeVisible();
    }
  });

  test("venue step shows choice screen or completed state", async ({
    page,
  }) => {
    await goToStep(page, "venue");
    await expect(
      page.getByRole("heading", { level: 2, name: "Venue" }),
    ).toBeVisible();

    const venueComplete = await isTextVisible(page, "Venue added");

    if (venueComplete) {
      await expect(
        page.getByRole("button", { name: "Continue" }),
      ).toBeVisible();
    } else {
      await expect(page.getByText("Add new venue")).toBeVisible();
      await expect(page.getByText("Claim existing listing")).toBeVisible();

      await page.getByText("Add new venue").click();
      await expect(page.getByLabel(/Venue Name/)).toBeVisible();

      await page.getByLabel(/Venue Name/).fill(`E2E Venue ${Date.now()}`);
      await page.getByLabel(/Street Address/).fill("123 E2E St");

      const provinceSelected = await selectFirstOptionInField(page, "Province");

      if (provinceSelected) {
        await expect(
          page.getByRole("combobox", { name: /City/ }),
        ).toBeEnabled();
        const citySelected = await selectFirstOptionInField(page, "City");

        if (citySelected) {
          await page.getByRole("button", { name: "Create Venue" }).click();
          await expect(
            page.getByText("Venue created successfully"),
          ).toBeVisible();
        } else {
          await page.getByRole("button", { name: "Cancel" }).click();
        }
      } else {
        await page.getByRole("button", { name: "Cancel" }).click();
      }
    }
  });

  test("courts step shows form or completed state", async ({ page }) => {
    await goToStep(page, "courts");
    await expect(
      page.getByRole("heading", { level: 2, name: "Courts" }),
    ).toBeVisible();

    const courtsComplete = await isTextVisible(page, "Court added");

    if (courtsComplete) {
      await expect(
        page.getByRole("button", { name: "Continue" }),
      ).toBeVisible();
    } else {
      const claimPending = await isTextVisible(
        page,
        "Waiting for claim approval",
      );
      if (claimPending) return;

      const sportSelected = await selectFirstOptionInField(page, "Sport");
      if (sportSelected) {
        await page.getByLabel("Court Label").fill(`E2E Court ${Date.now()}`);
        await page.getByRole("button", { name: "Create Court" }).click();
        await expect(
          page.getByText("Court created successfully"),
        ).toBeVisible();
      }
    }
  });

  test("skippable steps render with Skip or Continue", async ({ page }) => {
    for (const { step, heading } of [
      { step: "config", heading: "Schedule & Pricing" },
      { step: "payment", heading: "Payment" },
      { step: "verify", heading: "Verification" },
    ]) {
      await goToStep(page, step);
      await expect(
        page.getByRole("heading", { level: 2, name: heading }),
      ).toBeVisible();

      const skipBtn = page.getByRole("button", { name: "Skip" });
      const continueBtn = page.getByRole("button", { name: "Continue" });
      const hasSkip =
        (await skipBtn.count()) > 0 && (await skipBtn.isVisible());
      const hasContinue =
        (await continueBtn.count()) > 0 && (await continueBtn.isVisible());
      expect(hasSkip || hasContinue).toBe(true);
    }
  });

  test("back navigation works through wizard steps", async ({ page }) => {
    // loginAsOwner auto-skips to the first incomplete step and sets
    // hasFired=true, so subsequent Back clicks won't trigger auto-skip.
    const stepText = await page.getByText(/Step \d+ of 6/).textContent();
    const startStep = Number(stepText?.match(/\d+/)?.[0]);

    // Navigate back through all previous steps.
    for (let expected = startStep - 1; expected >= 1; expected--) {
      await page.getByRole("button", { name: "Back" }).click();
      await expect(page.getByText(`Step ${expected} of 6`)).toBeVisible();
    }
  });
});
