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

type RemainderTracker = Map<string, number>;

function getParticipantOrder(participants: Participant[]) {
  return new Map(participants.map((participant, index) => [participant.id, index]));
}

function getParticipantGroupKey(participantIds: string[]) {
  return participantIds.join("|");
}

function sortParticipantIds(ids: string[], order: Map<string, number>) {
  return [...ids].sort((left, right) => {
    const leftIndex = order.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = order.get(right) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}

export function splitEvenlyWithOffset(totalCents: number, participantIds: string[], startIndex = 0) {
  if (participantIds.length === 0) {
    return {
      shares: {},
      nextStartIndex: 0,
    };
  }

  const normalizedStartIndex = ((startIndex % participantIds.length) + participantIds.length) % participantIds.length;
  const base = Math.floor(totalCents / participantIds.length);
  const remainder = totalCents - base * participantIds.length;
  const shares = participantIds.reduce<Record<string, number>>((result, participantId) => {
    result[participantId] = base;
    return result;
  }, {});

  for (let index = 0; index < remainder; index += 1) {
    const participantId = participantIds[(normalizedStartIndex + index) % participantIds.length];
    shares[participantId] += 1;
  }

  return {
    shares,
    nextStartIndex: (normalizedStartIndex + remainder) % participantIds.length,
  };
}

export function splitEvenly(totalCents: number, participantIds: string[]) {
  return splitEvenlyWithOffset(totalCents, participantIds).shares;
}

function splitEvenlyTracked(
  totalCents: number,
  participantIds: string[],
  remainderTracker?: RemainderTracker,
) {
  if (!remainderTracker || participantIds.length === 0) {
    return splitEvenly(totalCents, participantIds);
  }

  const key = getParticipantGroupKey(participantIds);
  const startIndex = remainderTracker.get(key) ?? 0;
  const { shares, nextStartIndex } = splitEvenlyWithOffset(totalCents, participantIds, startIndex);

  remainderTracker.set(key, nextStartIndex);

  return shares;
}

export function allocateByWeights(
  totalCents: number,
  participantIds: string[],
  weights: Record<string, number>,
) {
  if (participantIds.length === 0) {
    return {};
  }

  const weightSum = participantIds.reduce((sum, participantId) => sum + BigInt(weights[participantId] ?? 0), 0n);

  if (weightSum <= 0) {
    return splitEvenly(totalCents, participantIds);
  }

  const floors: Record<string, number> = {};
  const remainderCandidates = participantIds.map((participantId) => {
    const numerator = BigInt(totalCents) * BigInt(weights[participantId] ?? 0);
    const flooredShare = numerator / weightSum;
    floors[participantId] = Number(flooredShare);

    return {
      participantId,
      fractionalRemainder: numerator % weightSum,
    };
  });

  let remainder = totalCents - Object.values(floors).reduce((sum, value) => sum + value, 0);

  remainderCandidates.sort((left, right) => {
    if (right.fractionalRemainder !== left.fractionalRemainder) {
      return right.fractionalRemainder > left.fractionalRemainder ? 1 : -1;
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

export function calculateParticipantSubtotals(
  split: Pick<SplitLike, "participants" | "items">,
  remainderTracker?: RemainderTracker,
) {
  const participantOrder = getParticipantOrder(split.participants);
  const subtotals = split.participants.reduce<Record<string, number>>((result, participant) => {
    result[participant.id] = 0;
    return result;
  }, {});

  for (const item of split.items) {
    const orderedParticipants = sortParticipantIds(item.participantIds, participantOrder);
    const shares = splitEvenlyTracked(item.amountCents, orderedParticipants, remainderTracker);

    for (const participantId of orderedParticipants) {
      subtotals[participantId] = (subtotals[participantId] ?? 0) + shares[participantId];
    }
  }

  return subtotals;
}

export function calculateEqualParticipantSubtotals(
  subtotalCents: number,
  participants: Participant[],
  remainderTracker?: RemainderTracker,
) {
  const participantIds = participants.map((participant) => participant.id);
  return splitEvenlyTracked(subtotalCents, participantIds, remainderTracker);
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
  remainderTracker?: RemainderTracker,
) {
  const participantIds = participants.map((participant) => participant.id);

  if (mode === "equal") {
    return splitEvenlyTracked(totalCents, participantIds, remainderTracker);
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
  const remainderTracker: RemainderTracker = new Map();
  const subtotalCents = getSplitSubtotalCents(split.splitMode, split.items, split.billSubtotalCents);
  const subtotals =
    split.splitMode === "equal"
      ? calculateEqualParticipantSubtotals(subtotalCents, split.participants, remainderTracker)
      : calculateParticipantSubtotals(split, remainderTracker);
  const taxAllocation = allocateAdditionalCharges(
    split.taxCents,
    split.splitMode === "equal" ? "equal" : split.taxAllocationMode,
    split.participants,
    subtotals,
    remainderTracker,
  );
  const tipAllocation = allocateAdditionalCharges(
    split.tipCents,
    split.splitMode === "equal" ? "equal" : split.tipAllocationMode,
    split.participants,
    subtotals,
    remainderTracker,
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
