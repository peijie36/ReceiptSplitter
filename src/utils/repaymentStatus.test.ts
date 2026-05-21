import type { SavedSplit } from "@/types/split";
import { getRepaymentStatus, prunePaidParticipantIds } from "@/utils/repaymentStatus";

const baseSplit: SavedSplit = {
  id: "split-1",
  title: "Dinner",
  payerId: "payer",
  splitMode: "itemized",
  participants: [
    { id: "payer", name: "Alex" },
    { id: "blair", name: "Blair" },
    { id: "casey", name: "Casey" },
  ],
  items: [
    { id: "item-1", name: "Burger", amountCents: 1200, participantIds: ["blair"] },
    { id: "item-2", name: "Fries", amountCents: 900, participantIds: ["blair", "casey"] },
    { id: "item-3", name: "Tea", amountCents: 500, participantIds: ["payer"] },
  ],
  billSubtotalCents: 0,
  taxCents: 0,
  tipCents: 0,
  taxAllocationMode: "proportional",
  tipAllocationMode: "proportional",
  paidParticipantIds: [],
  createdAt: "2026-05-21T10:00:00.000Z",
  updatedAt: "2026-05-21T10:00:00.000Z",
};

describe("repayment status", () => {
  it("marks a split incomplete when money is owed and no participants are paid", () => {
    expect(getRepaymentStatus(baseSplit)).toEqual({
      paidParticipantIds: [],
      paidCount: 0,
      owedCount: 2,
      isCompleted: false,
    });
  });

  it("marks a split completed when every owed participant is paid", () => {
    expect(
      getRepaymentStatus({
        ...baseSplit,
        paidParticipantIds: ["blair", "casey"],
      }),
    ).toEqual({
      paidParticipantIds: ["blair", "casey"],
      paidCount: 2,
      owedCount: 2,
      isCompleted: true,
    });
  });

  it("marks a split with no reimbursements due as completed", () => {
    const payerOnlySplit: SavedSplit = {
      ...baseSplit,
      participants: [{ id: "payer", name: "Alex" }],
      items: [{ id: "item-1", name: "Tea", amountCents: 500, participantIds: ["payer"] }],
      paidParticipantIds: [],
    };

    expect(getRepaymentStatus(payerOnlySplit)).toEqual({
      paidParticipantIds: [],
      paidCount: 0,
      owedCount: 0,
      isCompleted: true,
    });
  });

  it("ignores stale, duplicate, payer, and non-owing paid participant ids", () => {
    const split: SavedSplit = {
      ...baseSplit,
      paidParticipantIds: ["casey", "casey", "payer", "missing"],
    };

    expect(prunePaidParticipantIds(split)).toEqual(["casey"]);
    expect(getRepaymentStatus(split)).toEqual({
      paidParticipantIds: ["casey"],
      paidCount: 1,
      owedCount: 2,
      isCompleted: false,
    });
  });
});
