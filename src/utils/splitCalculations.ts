import type {
  AllocationMode,
  DraftSplit,
  Item,
  OwedSummaryEntry,
  Participant,
  ParticipantTotals,
  SavedSplit,
  SplitCalculationResult,
  SplitMode,
} from "@/types/split";

type SplitLike = Pick<
  DraftSplit,
  | "participants"
  | "splitMode"
  | "items"
  | "billSubtotalCents"
  | "taxCents"
  | "tipCents"
  | "taxAllocationMode"
  | "tipAllocationMode"
  | "payerId"
>;

function getParticipantOrder(participants: Participant[]) {
  return new Map(participants.map((participant, index) => [participant.id, index]));
}

function sortParticipantIds(ids: string[], order: Map<string, number>) {
  return [...ids].sort((left, right) => {
    const leftIndex = order.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = order.get(right) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}

export function splitEvenly(totalCents: number, participantIds: string[]) {
  if (participantIds.length === 0) {
    return {};
  }

  const base = Math.floor(totalCents / participantIds.length);
  let remainder = totalCents - base * participantIds.length;

  return participantIds.reduce<Record<string, number>>((result, participantId) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    result[participantId] = base + extra;
    return result;
  }, {});
}

export function allocateByWeights(
  totalCents: number,
  participantIds: string[],
  weights: Record<string, number>,
) {
  if (participantIds.length === 0) {
    return {};
  }

  const weightSum = participantIds.reduce((sum, participantId) => sum + (weights[participantId] ?? 0), 0);

  if (weightSum <= 0) {
    return splitEvenly(totalCents, participantIds);
  }

  const floors: Record<string, number> = {};
  const remainderCandidates = participantIds.map((participantId) => {
    const exactShare = (totalCents * (weights[participantId] ?? 0)) / weightSum;
    const flooredShare = Math.floor(exactShare);
    floors[participantId] = flooredShare;

    return {
      participantId,
      fractionalRemainder: exactShare - flooredShare,
    };
  });

  let remainder = totalCents - Object.values(floors).reduce((sum, value) => sum + value, 0);

  remainderCandidates.sort((left, right) => {
    if (right.fractionalRemainder !== left.fractionalRemainder) {
      return right.fractionalRemainder - left.fractionalRemainder;
    }

    return participantIds.indexOf(left.participantId) - participantIds.indexOf(right.participantId);
  });

  for (const candidate of remainderCandidates) {
    if (remainder === 0) {
      break;
    }

    floors[candidate.participantId] += 1;
    remainder -= 1;
  }

  return floors;
}

export function calculateParticipantSubtotals(split: Pick<SplitLike, "participants" | "items">) {
  const participantOrder = getParticipantOrder(split.participants);
  const subtotals = split.participants.reduce<Record<string, number>>((result, participant) => {
    result[participant.id] = 0;
    return result;
  }, {});

  for (const item of split.items) {
    const orderedParticipants = sortParticipantIds(item.participantIds, participantOrder);
    const shares = splitEvenly(item.amountCents, orderedParticipants);

    for (const participantId of orderedParticipants) {
      subtotals[participantId] = (subtotals[participantId] ?? 0) + shares[participantId];
    }
  }

  return subtotals;
}

export function calculateEqualParticipantSubtotals(
  subtotalCents: number,
  participants: Participant[],
) {
  const participantIds = participants.map((participant) => participant.id);
  return splitEvenly(subtotalCents, participantIds);
}

export function getSplitSubtotalCents(
  splitMode: SplitMode,
  items: Item[],
  billSubtotalCents: number,
) {
  if (splitMode === "equal") {
    return billSubtotalCents;
  }

  return items.reduce((sum, item) => sum + item.amountCents, 0);
}

export function allocateAdditionalCharges(
  totalCents: number,
  mode: AllocationMode,
  participants: Participant[],
  subtotals: Record<string, number>,
) {
  const participantIds = participants.map((participant) => participant.id);

  if (mode === "equal") {
    return splitEvenly(totalCents, participantIds);
  }

  return allocateByWeights(totalCents, participantIds, subtotals);
}

export function buildOwedSummary(participantTotals: ParticipantTotals[]) {
  return participantTotals
    .filter((participant) => !participant.isPayer && participant.totalCents > 0)
    .map<OwedSummaryEntry>((participant) => ({
      participantId: participant.participantId,
      participantName: participant.participantName,
      owedCents: participant.totalCents,
    }));
}

export function calculateFinalTotals(split: SplitLike | SavedSplit): SplitCalculationResult {
  const subtotalCents = getSplitSubtotalCents(split.splitMode, split.items, split.billSubtotalCents);
  const subtotals =
    split.splitMode === "equal"
      ? calculateEqualParticipantSubtotals(subtotalCents, split.participants)
      : calculateParticipantSubtotals(split);
  const taxAllocation = allocateAdditionalCharges(
    split.taxCents,
    split.splitMode === "equal" ? "equal" : split.taxAllocationMode,
    split.participants,
    subtotals,
  );
  const tipAllocation = allocateAdditionalCharges(
    split.tipCents,
    split.splitMode === "equal" ? "equal" : split.tipAllocationMode,
    split.participants,
    subtotals,
  );

  const participantTotals = split.participants.map<ParticipantTotals>((participant) => {
    const subtotalCents = subtotals[participant.id] ?? 0;
    const taxCents = taxAllocation[participant.id] ?? 0;
    const tipCents = tipAllocation[participant.id] ?? 0;

    return {
      participantId: participant.id,
      participantName: participant.name,
      subtotalCents,
      taxCents,
      tipCents,
      totalCents: subtotalCents + taxCents + tipCents,
      isPayer: participant.id === split.payerId,
    };
  });

  return {
    participantTotals,
    subtotalCents,
    taxCents: split.taxCents,
    tipCents: split.tipCents,
    grandTotalCents: subtotalCents + split.taxCents + split.tipCents,
    owedSummary: buildOwedSummary(participantTotals),
  };
}

export function getSavedSplitTotal(split: SavedSplit) {
  return getSplitSubtotalCents(split.splitMode, split.items, split.billSubtotalCents) + split.taxCents + split.tipCents;
}

export function getItemParticipantNames(item: Item, participants: Participant[]) {
  const participantMap = new Map(participants.map((participant) => [participant.id, participant.name]));
  return item.participantIds.map((participantId) => participantMap.get(participantId) ?? "Unknown");
}
