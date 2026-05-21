import { expect, type Page } from "@playwright/test";

type ItemInput = {
  name: string;
  amount: string;
  assignees: string[];
};

export async function clearAppState(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

export async function openFreshEditor(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /start fresh split/i }).click();
  await expect(page).toHaveURL(/\/split\/new$/);
}

export async function addParticipant(page: Page, name: string) {
  await page.getByLabel("Add participant name").fill(name);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("button", { name: `Assign ${name}` })).toBeVisible();
}

export async function addItem(page: Page, item: ItemInput) {
  const newItemForm = page.locator("form").filter({ has: page.getByLabel("Item name") });

  await newItemForm.getByLabel("Item name").fill(item.name);
  await newItemForm.getByLabel("Amount").fill(item.amount);

  for (const assignee of item.assignees) {
    await newItemForm.getByRole("button", { name: `Assign ${assignee}` }).click();
  }

  await newItemForm.getByRole("button", { name: /add item/i }).click();
  await expect(page.getByText(item.name, { exact: true })).toBeVisible();
}

export async function saveSplit(page: Page) {
  await page.getByRole("button", { name: /save split/i }).click();
  await expect(page).toHaveURL(/\/split\/[^/]+$/);
}

export async function showLiveSummary(page: Page) {
  const desktopSummary = page.getByRole("heading", { name: "Live summary" });

  if (await desktopSummary.isVisible()) {
    return;
  }

  const mobileSummaryButton = page.getByRole("button", { name: /live summary/i });
  if (await mobileSummaryButton.isVisible()) {
    await mobileSummaryButton.click();
  }
}

export async function createBasicItemizedSplit(page: Page, title = "Dinner") {
  await openFreshEditor(page);
  await page.getByLabel("Split title").fill(title);
  await addParticipant(page, "Alex");
  await addParticipant(page, "Blair");
  await addParticipant(page, "Casey");
  await addItem(page, { name: "Burger", amount: "12.00", assignees: ["Blair"] });
  await addItem(page, { name: "Fries", amount: "9.00", assignees: ["Blair", "Casey"] });
  await page.getByRole("textbox", { name: "Tax", exact: true }).fill("2.10");
  await page.getByRole("textbox", { name: "Tip", exact: true }).fill("4.20");
}
