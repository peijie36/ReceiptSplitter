import type { Item, SavedSplit, SplitCalculationResult } from "@/types/split";
import { buildPaymentSummaryTextFromTotals } from "@/utils/paymentSummary";
import { getRepaymentStatusFromTotals, type RepaymentStatus } from "@/utils/repaymentStatus";
import { calculateFinalTotals } from "@/utils/splitCalculations";

export type SavedSplitItemSummary = Pick<Item, "id" | "name" | "amountCents"> & {
  participantNames: string[];
};

export type SavedSplitReadModel = {
  totals: SplitCalculationResult;
  repaymentStatus: RepaymentStatus;
  paidParticipantIdSet: Set<string>;
  itemSummaries: SavedSplitItemSummary[];
  totalCents: number;
  paymentSummaryText: string;
};

function buildItemSummaries(split: SavedSplit) {
  const participantNameById = new Map(split.participants.map((participant) => [participant.id, participant.name]));

  return split.items.map<SavedSplitItemSummary>((item) => ({
    id: item.id,
    name: item.name,
    amountCents: item.amountCents,
    participantNames: item.participantIds.map((participantId) => participantNameById.get(participantId) ?? "Unknown"),
  }));
}

export function buildSavedSplitReadModel(split: SavedSplit): SavedSplitReadModel {
  const totals = calculateFinalTotals(split);
  const repaymentStatus = getRepaymentStatusFromTotals(split, totals);

  return {
    totals,
    repaymentStatus,
    paidParticipantIdSet: new Set(repaymentStatus.paidParticipantIds),
    itemSummaries: buildItemSummaries(split),
    totalCents: totals.grandTotalCents,
    paymentSummaryText: buildPaymentSummaryTextFromTotals(split, totals),
  };
}
