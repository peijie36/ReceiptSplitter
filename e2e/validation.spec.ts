import { expect, test } from "@playwright/test";

import { addParticipant, clearAppState, openFreshEditor } from "./helpers";

test.beforeEach(async ({ page }) => {
  await clearAppState(page);
});

test("shows participant validation errors and keeps save unavailable", async ({ page }) => {
  await openFreshEditor(page);
  await addParticipant(page, "Alex");

  await page.getByLabel("Add participant name").fill("Alex");
  await page.getByRole("button", { name: "Add", exact: true }).click();

  await expect(page.getByText("Participant names must be unique.")).toBeVisible();
  await expect(page.getByRole("button", { name: /save split/i })).toBeDisabled();
});

test("shows item validation errors and keeps save unavailable", async ({ page }) => {
  await openFreshEditor(page);
  await addParticipant(page, "Alex");

  await page.getByLabel("Item name").fill("Burger");
  await page.getByLabel("Amount").first().fill("0");
  await page.getByRole("button", { name: /add item/i }).click();

  await expect(page.getByText("Item amount must be greater than zero.")).toBeVisible();
  await expect(page.getByRole("button", { name: /save split/i })).toBeDisabled();

  await page.getByLabel("Amount").first().fill("12.00");
  await page.getByRole("button", { name: /add item/i }).click();

  await expect(page.getByText("Assign the item to at least one participant.")).toBeVisible();
  await expect(page.getByRole("button", { name: /save split/i })).toBeDisabled();
});
