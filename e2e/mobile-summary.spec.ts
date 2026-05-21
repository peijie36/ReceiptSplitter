import { expect, test } from "@playwright/test";

import { clearAppState, openFreshEditor } from "./helpers";

test.beforeEach(async ({ page }) => {
  await clearAppState(page);
});

test("opens the mobile summary dock", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "Mobile Chrome", "Mobile summary dock is covered by the mobile project only.");

  await openFreshEditor(page);

  const summaryDockButton = page.getByRole("button", { name: /live summary/i });
  await expect(summaryDockButton).toBeVisible();
  await expect(page.getByRole("button", { name: /save split/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /reset draft/i })).toBeVisible();

  await summaryDockButton.click();

  const dockContent = page.locator("#mobile-summary-dock-content");
  await expect(dockContent.getByText("Who owes the payer")).toBeVisible();
  await expect(dockContent.getByText("Draft still needs a few things")).toBeVisible();
});
