import type { SavedSplit } from "@/types/split";
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

export function prunePaidParticipantIds(split: SavedSplit) {
  const owedParticipantIds = getOwedParticipantIds(split);
  const owedParticipantIdSet = new Set(owedParticipantIds);
  const paidParticipantIdSet = new Set(split.paidParticipantIds);

  return owedParticipantIds.filter(
    (participantId) => owedParticipantIdSet.has(participantId) && paidParticipantIdSet.has(participantId),
  );
}

export function getRepaymentStatus(split: SavedSplit): RepaymentStatus {
  const owedParticipantIds = getOwedParticipantIds(split);
  const paidParticipantIds = prunePaidParticipantIds(split);

  return {
    paidParticipantIds,
    paidCount: paidParticipantIds.length,
    owedCount: owedParticipantIds.length,
    isCompleted: paidParticipantIds.length === owedParticipantIds.length,
  };
}
