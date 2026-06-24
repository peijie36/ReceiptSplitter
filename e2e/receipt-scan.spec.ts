import { expect, test } from "@playwright/test";

import { addParticipant, clearAppState, openFreshEditor } from "./helpers";

test.beforeEach(async ({ page }) => {
  await clearAppState(page);
});

test("reviews, imports, and persists a scanned receipt", async ({ page }) => {
  await openFreshEditor(page);
  await addParticipant(page, "Alex");

  await page.getByRole("button", { name: "Scan receipt" }).click();
  await page.getByLabel("Receipt image").setInputFiles({
    name: "receipt.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("e2e receipt fixture"),
  });

  const scanner = page.getByRole("dialog", { name: "Scan receipt" });

  await expect(
    scanner.getByRole("textbox", { name: "Item 1", exact: true }),
  ).toHaveValue("Latte");
  await expect(page.getByLabel("Receipt tax")).toHaveValue("0.40");

  await page.getByRole("button", { name: "Assign Alex" }).click();
  await page.getByRole("button", { name: "Import receipt" }).click();

  await expect(page.getByText("Latte", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Tax", exact: true })).toHaveValue("0.40");

  await page.reload();

  await expect(page.getByText("Latte", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Tax", exact: true })).toHaveValue("0.40");
});
