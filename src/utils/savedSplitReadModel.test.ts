import type { SavedSplit } from "@/types/split";
import { buildSavedSplitReadModel } from "@/utils/savedSplitReadModel";

function buildSavedSplit(overrides: Partial<SavedSplit> = {}): SavedSplit {
  return {
    id: overrides.id ?? "split-1",
    title: overrides.title ?? "Dinner",
    payerId: overrides.payerId ?? "payer",
    splitMode: overrides.splitMode ?? "itemized",
    participants:
      overrides.participants ??
      [
        { id: "payer", name: "Alex" },
        { id: "blair", name: "Blair" },
        { id: "casey", name: "Casey" },
      ],
    items:
      overrides.items ??
      [
        { id: "item-1", name: "Pizza", amountCents: 1800, participantIds: ["blair"] },
        { id: "item-2", name: "Salad", amountCents: 900, participantIds: ["payer", "casey"] },
      ],
    billSubtotalCents: overrides.billSubtotalCents ?? 0,
    taxCents: overrides.taxCents ?? 0,
    tipCents: overrides.tipCents ?? 0,
    taxAllocationMode: overrides.taxAllocationMode ?? "proportional",
    tipAllocationMode: overrides.tipAllocationMode ?? "proportional",
    paidParticipantIds: overrides.paidParticipantIds ?? [],
    createdAt: overrides.createdAt ?? "2026-03-29T12:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-03-29T12:00:00.000Z",
  };
}

describe("buildSavedSplitReadModel", () => {
  it("builds item summaries with participant names and total cents", () => {
    const model = buildSavedSplitReadModel(buildSavedSplit());

    expect(model.totalCents).toBe(2700);
    expect(model.itemSummaries).toEqual([
      {
        id: "item-1",
        name: "Pizza",
        amountCents: 1800,
        participantNames: ["Blair"],
      },
      {
        id: "item-2",
        name: "Salad",
        amountCents: 900,
        participantNames: ["Alex", "Casey"],
      },
    ]);
  });

  it("builds repayment status and excludes stale paid participant ids", () => {
    const model = buildSavedSplitReadModel(
      buildSavedSplit({
        paidParticipantIds: ["blair", "payer", "missing"],
      }),
    );

    expect(model.repaymentStatus).toEqual({
      paidParticipantIds: ["blair"],
      paidCount: 1,
      owedCount: 2,
      isCompleted: false,
    });
    expect(model.paidParticipantIdSet.has("blair")).toBe(true);
    expect(model.paidParticipantIdSet.has("payer")).toBe(false);
    expect(model.paidParticipantIdSet.has("missing")).toBe(false);
  });

  it("builds the same payment summary text from the shared totals", () => {
    const model = buildSavedSplitReadModel(buildSavedSplit());

    expect(model.paymentSummaryText).toBe(
      ["Dinner - 3/29", "", "Pay Alex:", "Blair owes Alex $18.00", "Casey owes Alex $4.50"].join("\n"),
    );
  });
});
