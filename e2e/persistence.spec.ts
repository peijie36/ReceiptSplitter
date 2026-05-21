import { expect, test } from "@playwright/test";

import { addItem, addParticipant, clearAppState, openFreshEditor } from "./helpers";

test.beforeEach(async ({ page }) => {
  await clearAppState(page);
});

test("persists the current draft through reload and reflects it on home", async ({ page }) => {
  await openFreshEditor(page);
  await page.getByLabel("Split title").fill("Persisted dinner");
  await addParticipant(page, "Alex");
  await addParticipant(page, "Blair");
  await addItem(page, { name: "Burger", amount: "12.00", assignees: ["Blair"] });

  await page.reload();

  await expect(page.getByLabel("Split title")).toHaveValue("Persisted dinner");
  await expect(page.getByRole("button", { name: "Assign Alex" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Assign Blair" }).first()).toBeVisible();
  await expect(page.getByText("Burger", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: /ReceiptSplitter/ }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Persisted dinner")).toBeVisible();
  await expect(page.getByText("Participants").locator("..").getByText("2")).toBeVisible();
  await expect(page.getByText("Items").locator("..").getByText("1")).toBeVisible();
});
