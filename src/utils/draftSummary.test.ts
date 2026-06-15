import type { DraftSplit } from "@/types/split";
import { buildDraftSummaryReadModel } from "@/utils/draftSummary";

function buildDraft(overrides: Partial<DraftSplit> = {}): DraftSplit {
  const participants = overrides.participants ?? [
    { id: "payer", name: "Alex" },
    { id: "blair", name: "Blair" },
  ];

  return {
    id: "draft-1",
    sourceSplitId: overrides.sourceSplitId ?? null,
    title: overrides.title ?? "Dinner",
    payerId: "payerId" in overrides ? (overrides.payerId ?? null) : "payer",
    splitMode: overrides.splitMode ?? "itemized",
    participants,
    items:
      overrides.items ??
      [{ id: "item-1", name: "Pizza", amountCents: 2400, participantIds: ["payer", "blair"] }],
    billSubtotalCents: overrides.billSubtotalCents ?? 0,
    taxCents: overrides.taxCents ?? 0,
    tipCents: overrides.tipCents ?? 0,
    taxAllocationMode: overrides.taxAllocationMode ?? "proportional",
    tipAllocationMode: overrides.tipAllocationMode ?? "proportional",
    paidParticipantIds: overrides.paidParticipantIds ?? [],
    updatedAt: overrides.updatedAt ?? "2026-03-29T00:00:00.000Z",
  };
}

describe("buildDraftSummaryReadModel", () => {
  it("marks a valid itemized draft as saveable with calculated totals", () => {
    const model = buildDraftSummaryReadModel(buildDraft(), {});

    expect(model.canSave).toBe(true);
    expect(model.validationErrors).toEqual([]);
    expect(model.issueLabel).toBe("0 issues to fix before saving");
    expect(model.summaryDescription).toBe("Totals reconcile to the cent.");
    expect(model.totals.grandTotalCents).toBe(2400);
  });

  it("combines draft validation errors and local editor issues", () => {
    const model = buildDraftSummaryReadModel(
      buildDraft({
        participants: [],
        payerId: null,
        items: [],
      }),
      {
        billSubtotal: "Enter a valid subtotal.",
      },
    );

    expect(model.canSave).toBe(false);
    expect(model.validationErrors).toEqual([
      "Add at least one participant.",
      "Choose a payer.",
      "Add at least one item.",
      "Enter a valid subtotal.",
    ]);
    expect(model.issueLabel).toBe("4 issues to fix before saving");
  });

  it("describes equal-mode drafts and returns equal-mode totals", () => {
    const model = buildDraftSummaryReadModel(
      buildDraft({
        splitMode: "equal",
        billSubtotalCents: 3000,
        taxCents: 300,
        tipCents: 150,
        items: [],
      }),
      {},
    );

    expect(model.summaryDescription).toBe("Bill is split evenly in cents.");
    expect(model.canSave).toBe(true);
    expect(model.totals.grandTotalCents).toBe(3450);
    expect(model.totals.participantTotals.map((participant) => participant.totalCents)).toEqual([1725, 1725]);
  });
});
