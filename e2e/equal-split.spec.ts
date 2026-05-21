import { expect, test } from "@playwright/test";

import { addParticipant, clearAppState, openFreshEditor, saveSplit, showLiveSummary } from "./helpers";

test.beforeEach(async ({ page }) => {
  await clearAppState(page);
});

test("creates and saves a whole-bill equal split", async ({ page }) => {
  await openFreshEditor(page);
  await page.getByLabel("Split title").fill("Lunch");
  await addParticipant(page, "Alex");
  await addParticipant(page, "Blair");
  await addParticipant(page, "Casey");

  await page.getByText("Split whole bill equally").click();
  await page.getByLabel("Subtotal before tax and tip").fill("30.00");
  await page.getByRole("textbox", { name: "Tax", exact: true }).fill("3.00");
  await page.getByRole("textbox", { name: "Tip", exact: true }).fill("6.00");
  await showLiveSummary(page);

  await expect(page.getByText("Forced to equal in this mode")).toHaveCount(2);
  await expect(page.getByText("$39.00").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Blair\s+\$13\.00/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Casey\s+\$13\.00/ })).toBeVisible();

  await saveSplit(page);

  await expect(page.getByRole("heading", { name: "Lunch" })).toBeVisible();
  await expect(page.getByText("Whole bill equally")).toBeVisible();
  await expect(page.getByText("$39.00").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("$13.00").filter({ visible: true }).first()).toBeVisible();
});
