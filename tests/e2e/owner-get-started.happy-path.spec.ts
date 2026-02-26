import { expect, type Page, test } from "@playwright/test";
import { hasOwnerCredentials, loginAsOwner } from "./helpers/auth-login";

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

async function expectAnyTextVisible(page: Page, texts: string[]) {
  for (const text of texts) {
    if ((await page.getByText(text).count()) > 0) {
      await expect(page.getByText(text).first()).toBeVisible();
      return;
    }
  }
  throw new Error(
    `None of the expected texts were visible: ${texts.join(", ")}`,
  );
}

async function isTextVisible(page: Page, text: string): Promise<boolean> {
  const locator = page.getByText(text).first();
  return (await locator.count()) > 0 && (await locator.isVisible());
}

async function clickFirstVisibleEnabledButton(
  page: Page,
  name: string,
): Promise<boolean> {
  const buttons = page.getByRole("button", { name });
  const count = await buttons.count();

  for (let i = 0; i < count; i += 1) {
    const button = buttons.nth(i);
    if ((await button.isVisible()) && (await button.isEnabled())) {
      await button.click();
      return true;
    }
  }

  return false;
}

test.describe("Owner get-started happy path", () => {
  test.skip(
    !hasOwnerCredentials,
    "Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD to run this suite.",
  );

  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test("owner setup cards and overlays are actionable", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Owner Setup" }),
    ).toBeVisible();

    const attemptedOrgCreate = await clickFirstVisibleEnabledButton(
      page,
      "Create organization",
    );

    if (attemptedOrgCreate) {
      await page.getByLabel("Organization Name").fill(`E2E Org ${Date.now()}`);
      await page.getByRole("button", { name: "Create Organization" }).click();
      await expect(page.getByText("Organization created")).toBeVisible();
    } else {
      await expect(
        page.getByRole("button", { name: "Create organization" }).first(),
      ).toBeVisible();
    }

    const hasOrganization = await isTextVisible(page, "Organization created");
    let hasVenue = false;

    const attemptedVenueCreate = hasOrganization
      ? await clickFirstVisibleEnabledButton(page, "Add venue")
      : false;

    if (attemptedVenueCreate) {
      await expect(
        page.getByRole("heading", { name: "Add new venue" }),
      ).toBeVisible();

      await page.getByLabel("Venue Name").fill(`E2E Venue ${Date.now()}`);
      await page.getByLabel("Street Address").fill("123 E2E St");
      const provinceSelected = await selectFirstOptionInField(page, "Province");
      const citySelected = await selectFirstOptionInField(page, "City");

      if (provinceSelected && citySelected) {
        await page.getByRole("button", { name: "Create Venue" }).click();
        await expect(page.getByText("Venue added")).toBeVisible();
      } else {
        await page.getByRole("button", { name: "Cancel" }).click();
      }
    }

    hasVenue = await isTextVisible(page, "Venue added");

    const attemptedCourtSetup = hasVenue
      ? await clickFirstVisibleEnabledButton(page, "Set up courts")
      : false;

    if (attemptedCourtSetup) {
      await expect(
        page.getByRole("heading", { name: "Configure courts" }),
      ).toBeVisible();

      const sportSelected = await selectFirstOptionInField(page, "Sport");
      if (sportSelected) {
        await page.getByLabel("Court Label").fill(`E2E Court ${Date.now()}`);
        await page.getByRole("button", { name: "Create Court" }).click();
        await expectAnyTextVisible(page, [
          "Courts configured",
          "Courts need updates",
        ]);
      } else {
        await page.getByRole("button", { name: "Cancel" }).click();
      }
    }

    const verifyAction = page
      .getByRole("button", {
        name: /Submit verification|View submission|Resubmit docs|View verification/,
      })
      .first();

    if (hasVenue) {
      await expect(verifyAction).toBeEnabled();
      await verifyAction.click();
      await expect(page.getByText("Venue verification")).toBeVisible();
    } else {
      await expect(verifyAction).toBeDisabled();
    }
  });
});
