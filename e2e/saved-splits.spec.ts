import { expect, test } from "@playwright/test";

import { clearAppState, createBasicItemizedSplit, saveSplit } from "./helpers";

test.beforeEach(async ({ page }) => {
  await clearAppState(page);
});

test("views, edits, and deletes a saved split", async ({ page }) => {
  await createBasicItemizedSplit(page, "Saved dinner");
  await saveSplit(page);

  await page.getByRole("link", { name: /back to saved splits/i }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Saved dinner")).toBeVisible();
  await expect(page.getByText("$27.30")).toBeVisible();

  await page.getByRole("button", { name: "View" }).click();
  await expect(page.getByRole("heading", { name: "Saved dinner" })).toBeVisible();

  await page.getByRole("button", { name: /^edit$/i }).click();
  await expect(page).toHaveURL(/\/split\/new$/);
  await expect(page.getByLabel("Split title")).toHaveValue("Saved dinner");
  await expect(page.getByText("Burger", { exact: true })).toBeVisible();

  await page.getByLabel("Split title").fill("Updated dinner");
  await saveSplit(page);
  await page.getByRole("link", { name: /back to saved splits/i }).click();
  await expect(page.getByText("Updated dinner")).toBeVisible();
  await expect(page.getByText("Saved dinner")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "View" })).toHaveCount(1);

  await page.getByRole("link", { name: /ReceiptSplitter/ }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete" }).last().click();

  await expect(page.getByText("No saved splits yet. Save a completed draft to keep a history.")).toBeVisible();
  await expect(page.getByRole("button", { name: "View" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
});

test("tracks paid participants and marks a saved split completed", async ({ page }) => {
  await createBasicItemizedSplit(page, "Repayment dinner");
  await saveSplit(page);

  await page.getByRole("button", { name: "Mark Blair as paid" }).click();
  await expect(page.getByRole("button", { name: "Mark Blair as unpaid" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("1/2 paid")).toBeVisible();

  await page.getByRole("button", { name: "Mark Casey as paid" }).click();
  await expect(page.getByRole("button", { name: "Mark Casey as unpaid" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Completed")).toBeVisible();

  await page.getByRole("link", { name: /back to saved splits/i }).click();
  await expect(page.getByText("Repayment dinner")).toBeVisible();
  await expect(page.getByText("Completed")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Repayment dinner")).toBeVisible();
  await expect(page.getByText("Completed")).toBeVisible();
});
