import { expect, test } from "@playwright/test";

import { clearAppState } from "./helpers";

test.beforeEach(async ({ page }) => {
  await clearAppState(page);
});

test("opens the split editor from the home page", async ({ page }, testInfo) => {
  await expect(page).toHaveTitle(/ReceiptSplitter/);
  await expect(page.getByRole("heading", { name: /split the bill without splitting focus/i })).toBeVisible();
  await expect(page.getByText("No saved splits yet. Save a completed draft to keep a history.")).toBeVisible();

  await page.getByRole("button", { name: /start fresh split/i }).click();

  await expect(page).toHaveURL(/\/split\/new$/);
  await expect(page.getByLabel("Split title")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Participants", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Items", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tax and tip", exact: true })).toBeVisible();
  if (testInfo.project.name === "Mobile Chrome") {
    await expect(page.getByRole("button", { name: /live summary/i })).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { name: "Live summary" })).toBeVisible();
  }
});
