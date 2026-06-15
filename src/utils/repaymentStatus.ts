import type { SavedSplit, SplitCalculationResult } from "@/types/split";
import { calculateFinalTotals } from "@/utils/splitCalculations";

export type RepaymentStatus = {
  paidParticipantIds: string[];
  paidCount: number;
  owedCount: number;
  isCompleted: boolean;
};

export function getOwedParticipantIds(split: SavedSplit) {
  return calculateFinalTotals(split).owedSummary.map((entry) => entry.participantId);
}

export function getOwedParticipantIdsFromTotals(totals: Pick<SplitCalculationResult, "owedSummary">) {
  return totals.owedSummary.map((entry) => entry.participantId);
}

export function prunePaidParticipantIdsFromOwedIds(split: SavedSplit, owedParticipantIds: string[]) {
  const owedParticipantIdSet = new Set(owedParticipantIds);
  const paidParticipantIdSet = new Set(split.paidParticipantIds);

  return owedParticipantIds.filter(
    (participantId) => owedParticipantIdSet.has(participantId) && paidParticipantIdSet.has(participantId),
  );
}

export function prunePaidParticipantIds(split: SavedSplit) {
  return prunePaidParticipantIdsFromOwedIds(split, getOwedParticipantIds(split));
}

export function getRepaymentStatusFromTotals(
  split: SavedSplit,
  totals: Pick<SplitCalculationResult, "owedSummary">,
): RepaymentStatus {
  const owedParticipantIds = getOwedParticipantIdsFromTotals(totals);
  const paidParticipantIds = prunePaidParticipantIdsFromOwedIds(split, owedParticipantIds);

  return {
    paidParticipantIds,
    paidCount: paidParticipantIds.length,
    owedCount: owedParticipantIds.length,
    isCompleted: paidParticipantIds.length === owedParticipantIds.length,
  };
}

export function getRepaymentStatus(split: SavedSplit): RepaymentStatus {
  return getRepaymentStatusFromTotals(split, calculateFinalTotals(split));
}
