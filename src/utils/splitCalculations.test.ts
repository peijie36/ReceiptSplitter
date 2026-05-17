import type { DraftSplit } from "@/types/split";
import { calculateFinalTotals } from "@/utils/splitCalculations";

function buildSplit(overrides: Partial<DraftSplit> = {}): DraftSplit {
  const participants = overrides.participants ?? [
    { id: "payer", name: "Alex" },
    { id: "blair", name: "Blair" },
    { id: "casey", name: "Casey" },
  ];

  return {
    id: "draft-1",
    title: "Dinner",
    payerId: "payer",
    splitMode: overrides.splitMode ?? "itemized",
    participants,
    items: overrides.items ?? [],
    billSubtotalCents: overrides.billSubtotalCents ?? 0,
    taxCents: overrides.taxCents ?? 0,
    tipCents: overrides.tipCents ?? 0,
    taxAllocationMode: overrides.taxAllocationMode ?? "proportional",
    tipAllocationMode: overrides.tipAllocationMode ?? "proportional",
    updatedAt: overrides.updatedAt ?? "2026-03-29T00:00:00.000Z",
  };
}

describe("calculateFinalTotals", () => {
  it("handles one item assigned to one participant", () => {
    const split = buildSplit({
      items: [{ id: "item-1", name: "Pho", amountCents: 1450, participantIds: ["blair"] }],
    });

    const result = calculateFinalTotals(split);

    expect(result.participantTotals.find((entry) => entry.participantId === "blair")?.totalCents).toBe(1450);
    expect(result.owedSummary).toEqual([{ participantId: "blair", participantName: "Blair", owedCents: 1450 }]);
  });

  it("splits one item across multiple participants with deterministic remainders", () => {
    const split = buildSplit({
      items: [{ id: "item-1", name: "Nachos", amountCents: 1001, participantIds: ["payer", "blair"] }],
    });

    const result = calculateFinalTotals(split);

    expect(result.participantTotals.find((entry) => entry.participantId === "payer")?.subtotalCents).toBe(501);
    expect(result.participantTotals.find((entry) => entry.participantId === "blair")?.subtotalCents).toBe(500);
  });

  it("handles multiple items across multiple participants", () => {
    const split = buildSplit({
      items: [
        { id: "item-1", name: "Tacos", amountCents: 1200, participantIds: ["payer", "blair"] },
        { id: "item-2", name: "Soda", amountCents: 450, participantIds: ["casey"] },
        { id: "item-3", name: "Fries", amountCents: 500, participantIds: ["blair", "casey"] },
      ],
    });

    const result = calculateFinalTotals(split);

    expect(result.subtotalCents).toBe(2150);
    expect(result.participantTotals.map((entry) => entry.totalCents)).toEqual([600, 850, 700]);
    expect(result.grandTotalCents).toBe(2150);
  });

  it("rotates remainder cents across repeated shared items for the same participant group", () => {
    const split = buildSplit({
      items: [
        { id: "item-1", name: "Mint", amountCents: 1, participantIds: ["payer", "blair", "casey"] },
        { id: "item-2", name: "Sauce", amountCents: 1, participantIds: ["payer", "blair", "casey"] },
        { id: "item-3", name: "Spice", amountCents: 1, participantIds: ["payer", "blair", "casey"] },
      ],
    });

    const result = calculateFinalTotals(split);

    expect(result.participantTotals.map((entry) => entry.subtotalCents)).toEqual([1, 1, 1]);
    expect(result.participantTotals.map((entry) => entry.totalCents)).toEqual([1, 1, 1]);
  });

  it("keeps the payer in calculations when they are assigned some items", () => {
    const split = buildSplit({
      items: [{ id: "item-1", name: "Pasta", amountCents: 1800, participantIds: ["payer", "blair", "casey"] }],
      tipCents: 300,
      tipAllocationMode: "equal",
    });

    const result = calculateFinalTotals(split);
    const payer = result.participantTotals.find((entry) => entry.participantId === "payer");

    expect(payer?.subtotalCents).toBe(600);
    expect(payer?.tipCents).toBe(100);
    expect(result.owedSummary).toEqual([
      { participantId: "blair", participantName: "Blair", owedCents: 700 },
      { participantId: "casey", participantName: "Casey", owedCents: 700 },
    ]);
  });

  it("handles the payer being assigned to no items", () => {
    const split = buildSplit({
      items: [{ id: "item-1", name: "Pizza", amountCents: 2400, participantIds: ["blair", "casey"] }],
    });

    const result = calculateFinalTotals(split);

    expect(result.participantTotals.find((entry) => entry.participantId === "payer")?.totalCents).toBe(0);
    expect(result.owedSummary).toEqual([
      { participantId: "blair", participantName: "Blair", owedCents: 1200 },
      { participantId: "casey", participantName: "Casey", owedCents: 1200 },
    ]);
  });

  it("allocates tax proportionally based on item subtotal", () => {
    const split = buildSplit({
      items: [
        { id: "item-1", name: "Ramen", amountCents: 1000, participantIds: ["blair"] },
        { id: "item-2", name: "Tea", amountCents: 500, participantIds: ["casey"] },
      ],
      taxCents: 150,
      taxAllocationMode: "proportional",
    });

    const result = calculateFinalTotals(split);

    expect(result.participantTotals.find((entry) => entry.participantId === "blair")?.taxCents).toBe(100);
    expect(result.participantTotals.find((entry) => entry.participantId === "casey")?.taxCents).toBe(50);
  });

  it("allocates proportional charges exactly for large safe integer cent values", () => {
    const split = buildSplit({
      participants: [
        { id: "payer", name: "Alex" },
        { id: "blair", name: "Blair" },
        { id: "casey", name: "Casey" },
      ],
      items: [
        { id: "item-1", name: "A", amountCents: 9007199253875964, participantIds: ["payer"] },
        { id: "item-2", name: "B", amountCents: 9007199252102965, participantIds: ["blair"] },
        { id: "item-3", name: "C", amountCents: 725189, participantIds: ["casey"] },
      ],
      taxCents: 9007199253922172,
      taxAllocationMode: "proportional",
    });

    const result = calculateFinalTotals(split);

    expect(result.participantTotals.map((entry) => entry.taxCents)).toEqual([
      4503599627223038,
      4503599626336539,
      362595,
    ]);
  });

  it("allocates tax equally across all participants", () => {
    const split = buildSplit({
      items: [{ id: "item-1", name: "Soup", amountCents: 900, participantIds: ["blair"] }],
      taxCents: 5,
      taxAllocationMode: "equal",
    });

    const result = calculateFinalTotals(split);

    expect(result.participantTotals.map((entry) => entry.taxCents)).toEqual([2, 2, 1]);
  });

  it("allocates tip proportionally based on item subtotal", () => {
    const split = buildSplit({
      items: [
        { id: "item-1", name: "Sushi", amountCents: 900, participantIds: ["payer"] },
        { id: "item-2", name: "Roll", amountCents: 600, participantIds: ["blair"] },
      ],
      tipCents: 150,
      tipAllocationMode: "proportional",
    });

    const result = calculateFinalTotals(split);

    expect(result.participantTotals.map((entry) => entry.tipCents)).toEqual([90, 60, 0]);
  });

  it("allocates tip equally across all participants", () => {
    const split = buildSplit({
      items: [{ id: "item-1", name: "Tempura", amountCents: 1200, participantIds: ["payer", "blair", "casey"] }],
      tipCents: 4,
      tipAllocationMode: "equal",
    });

    const result = calculateFinalTotals(split);

    expect(result.participantTotals.map((entry) => entry.tipCents)).toEqual([2, 1, 1]);
  });

  it("reconciles exactly to the full bill total on rounding edges", () => {
    const split = buildSplit({
      items: [
        { id: "item-1", name: "Plates", amountCents: 1000, participantIds: ["payer", "blair", "casey"] },
        { id: "item-2", name: "Dessert", amountCents: 1000, participantIds: ["payer", "blair"] },
      ],
      taxCents: 101,
      tipCents: 99,
      taxAllocationMode: "proportional",
      tipAllocationMode: "equal",
    });

    const result = calculateFinalTotals(split);
    const sumOfParticipantTotals = result.participantTotals.reduce((sum, entry) => sum + entry.totalCents, 0);

    expect(sumOfParticipantTotals).toBe(result.grandTotalCents);
    expect(result.grandTotalCents).toBe(2200);
  });

  it("excludes the payer from the owed summary", () => {
    const split = buildSplit({
      items: [
        { id: "item-1", name: "Curry", amountCents: 1500, participantIds: ["payer"] },
        { id: "item-2", name: "Naan", amountCents: 900, participantIds: ["blair"] },
      ],
    });

    const result = calculateFinalTotals(split);

    expect(result.owedSummary.some((entry) => entry.participantId === "payer")).toBe(false);
    expect(result.owedSummary).toEqual([{ participantId: "blair", participantName: "Blair", owedCents: 900 }]);
  });

  it("splits the entire bill equally when equal mode is selected", () => {
    const split = buildSplit({
      splitMode: "equal",
      billSubtotalCents: 3000,
      taxCents: 300,
      tipCents: 150,
      taxAllocationMode: "proportional",
      tipAllocationMode: "proportional",
    });

    const result = calculateFinalTotals(split);

    expect(result.participantTotals.map((entry) => entry.subtotalCents)).toEqual([1000, 1000, 1000]);
    expect(result.participantTotals.map((entry) => entry.taxCents)).toEqual([100, 100, 100]);
    expect(result.participantTotals.map((entry) => entry.tipCents)).toEqual([50, 50, 50]);
    expect(result.participantTotals.map((entry) => entry.totalCents)).toEqual([1150, 1150, 1150]);
    expect(result.grandTotalCents).toBe(3450);
    expect(result.owedSummary).toEqual([
      { participantId: "blair", participantName: "Blair", owedCents: 1150 },
      { participantId: "casey", participantName: "Casey", owedCents: 1150 },
    ]);
  });

  it("uses deterministic remainder distribution in equal whole-bill mode", () => {
    const split = buildSplit({
      splitMode: "equal",
      billSubtotalCents: 1000,
      taxCents: 5,
      tipCents: 0,
    });

    const result = calculateFinalTotals(split);

    expect(result.participantTotals.map((entry) => entry.subtotalCents)).toEqual([334, 333, 333]);
    expect(result.participantTotals.map((entry) => entry.taxCents)).toEqual([1, 2, 2]);
    expect(result.participantTotals.map((entry) => entry.totalCents)).toEqual([335, 335, 335]);
    expect(result.grandTotalCents).toBe(1005);
  });

  it("keeps equal tax and tip allocations balanced when multiple equal splits happen in sequence", () => {
    const split = buildSplit({
      items: [{ id: "item-1", name: "Shared plate", amountCents: 1000, participantIds: ["payer", "blair", "casey"] }],
      taxCents: 5,
      tipCents: 4,
      taxAllocationMode: "equal",
      tipAllocationMode: "equal",
    });

    const result = calculateFinalTotals(split);

    expect(result.participantTotals.map((entry) => entry.totalCents)).toEqual([337, 336, 336]);
  });
});
