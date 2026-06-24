import { expect, test } from "@playwright/test";

import { addParticipant, clearAppState, openFreshEditor } from "./helpers";

test.beforeEach(async ({ page }) => {
  await clearAppState(page);
});

test("collapses newly added items and expands them for editing on mobile", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "Mobile Chrome", "Mobile item editors are covered by the mobile project only.");

  await openFreshEditor(page);
  await addParticipant(page, "Alex");
  await addParticipant(page, "Blair");

  const newItemForm = page.locator("form").filter({ has: page.getByLabel("Item name") });
  await newItemForm.getByLabel("Item name").fill("Burger");
  await newItemForm.getByLabel("Amount").fill("12.00");
  await newItemForm.getByRole("button", { name: "Assign Alex" }).click();
  await newItemForm.getByRole("button", { name: "Assign Blair" }).click();
  await newItemForm.getByRole("button", { name: /add item/i }).click();

  const disclosure = page.getByRole("button", { name: "Edit item 1: Burger" });

  await expect(disclosure).toHaveAttribute("aria-expanded", "false");
  const editorId = await disclosure.getAttribute("aria-controls");
  expect(editorId).not.toBeNull();
  const editor = page.locator(`[id="${editorId}"]`);

  await expect(disclosure.locator("..").getByText("Alex, Blair")).toBeVisible();
  await expect(editor).toBeHidden();

  await disclosure.click();

  await expect(disclosure).toHaveAttribute("aria-expanded", "true");
  await expect(editor).toBeVisible();
  await expect(editor.getByLabel("Item")).toHaveValue("Burger");
});
