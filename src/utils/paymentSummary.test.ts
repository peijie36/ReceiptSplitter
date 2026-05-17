import type { SavedSplit } from "@/types/split";
import { buildPaymentSummaryText } from "@/utils/paymentSummary";

function buildSavedSplit(overrides: Partial<SavedSplit> = {}): SavedSplit {
  return {
    id: "split-1",
    title: "Team dinner",
    payerId: "payer",
    splitMode: "itemized",
    participants: [
      { id: "payer", name: "Peijie" },
      { id: "alex", name: "Alex" },
      { id: "maya", name: "Maya" },
    ],
    items: [
      { id: "item-1", name: "Burger", amountCents: 1450, participantIds: ["alex"] },
      { id: "item-2", name: "Fries", amountCents: 600, participantIds: ["maya"] },
      { id: "item-3", name: "Tea", amountCents: 500, participantIds: ["payer"] },
    ],
    billSubtotalCents: 0,
    taxCents: 0,
    tipCents: 0,
    taxAllocationMode: "proportional",
    tipAllocationMode: "proportional",
    createdAt: "2026-05-16T20:30:00.000Z",
    updatedAt: "2026-05-16T20:30:00.000Z",
    ...overrides,
  };
}

describe("buildPaymentSummaryText", () => {
  it("formats the title with the receipt title and short saved date", () => {
    const summary = buildPaymentSummaryText(buildSavedSplit());

    expect(summary.split("\n")[0]).toBe("Team dinner - 5/16");
  });

  it("lists only the people who owe the payer", () => {
    const summary = buildPaymentSummaryText(buildSavedSplit());

    expect(summary).toContain("Pay Peijie:");
    expect(summary).toContain("Alex owes Peijie $14.50");
    expect(summary).toContain("Maya owes Peijie $6.00");
    expect(summary).not.toContain("Peijie owes Peijie");
  });

  it("handles splits with no reimbursements due", () => {
    const summary = buildPaymentSummaryText(
      buildSavedSplit({
        participants: [{ id: "payer", name: "Peijie" }],
        items: [{ id: "item-1", name: "Tea", amountCents: 500, participantIds: ["payer"] }],
      }),
    );

    expect(summary).toBe("Team dinner - 5/16\n\nNo reimbursements are due.");
  });
});
