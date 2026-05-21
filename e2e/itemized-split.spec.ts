import { expect, test } from "@playwright/test";

import { addParticipant, clearAppState, createBasicItemizedSplit, saveSplit, showLiveSummary } from "./helpers";

test.beforeEach(async ({ page }) => {
  await clearAppState(page);
});

test("creates and saves an itemized split", async ({ page }) => {
  await createBasicItemizedSplit(page, "Team dinner");
  await showLiveSummary(page);

  await expect(page.getByLabel("Payer").getByLabel("Payer").first()).toBeChecked();
  await expect(page.getByText("$21.00").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("$6.30").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("$27.30").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Blair\s+\$21\.45/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Casey\s+\$5\.85/ })).toBeVisible();

  await saveSplit(page);

  await expect(page.getByRole("heading", { name: "Team dinner" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Saved summary" })).toBeVisible();
  await expect(page.getByText("$27.30").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("Blair").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("$21.45").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("Casey").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("$5.85").filter({ visible: true }).first()).toBeVisible();
});

test("keeps the first participant as payer by default", async ({ page }) => {
  await page.goto("/split/new");

  await addParticipant(page, "Alex");
  await addParticipant(page, "Blair");

  await expect(page.getByLabel("Payer").getByLabel("Payer").first()).toBeChecked();
});
