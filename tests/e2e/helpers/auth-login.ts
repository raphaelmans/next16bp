import { expect, type Page } from "@playwright/test";

const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL;
const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD;

export const hasOwnerCredentials =
  Boolean(OWNER_EMAIL) && Boolean(OWNER_PASSWORD);

export async function loginAsOwner(page: Page): Promise<void> {
  if (!OWNER_EMAIL || !OWNER_PASSWORD) {
    throw new Error(
      "Missing E2E credentials. Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD.",
    );
  }

  await page.goto("/organization/get-started");

  if (page.url().includes("/login")) {
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await page.getByRole("textbox", { name: /email/i }).fill(OWNER_EMAIL);
    await page.getByRole("textbox", { name: /password/i }).fill(OWNER_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();
  }

  await page.waitForURL(/\/organization\/get-started/);
  await expect(page.getByText(/Step \d+ of 6/)).toBeVisible();
}
