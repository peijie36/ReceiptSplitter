import type { DraftSplit, SavedSplit } from "@/types/split";
import { createId } from "@/utils/id";
import { prunePaidParticipantIds } from "@/utils/repaymentStatus";

function nowIso() {
  return new Date().toISOString();
}

export function createEmptyDraft(): DraftSplit {
  return {
    id: createId(),
    sourceSplitId: null,
    title: "",
    payerId: null,
    splitMode: "itemized",
    participants: [],
    items: [],
    billSubtotalCents: 0,
    taxCents: 0,
    tipCents: 0,
    taxAllocationMode: "proportional",
    tipAllocationMode: "proportional",
    paidParticipantIds: [],
    updatedAt: nowIso(),
  };
}

export function touchDraft(draft: DraftSplit): DraftSplit {
  return {
    ...draft,
    updatedAt: nowIso(),
  };
}

export function hasDraftContent(draft: DraftSplit) {
  return (
    draft.title.trim().length > 0 ||
    draft.splitMode !== "itemized" ||
    draft.participants.length > 0 ||
    draft.items.length > 0 ||
    draft.billSubtotalCents > 0 ||
    draft.taxCents > 0 ||
    draft.tipCents > 0
  );
}

export function getSavedSplitTitle(title: string, createdAt: string) {
  const trimmed = title.trim();

  if (trimmed.length > 0) {
    return trimmed;
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return `Receipt split ${formatter.format(new Date(createdAt))}`;
}

export function createSnapshotFromDraft(draft: DraftSplit, existingSplit?: SavedSplit): SavedSplit {
  const timestamp = nowIso();

  if (!draft.payerId) {
    throw new Error("Cannot save a draft without a payer.");
  }

  const { sourceSplitId: _sourceSplitId, ...savedFields } = draft;

  const snapshot: SavedSplit = {
    ...savedFields,
    id: existingSplit?.id ?? createId(),
    title: getSavedSplitTitle(draft.title, timestamp),
    payerId: draft.payerId,
    createdAt: existingSplit?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  return {
    ...snapshot,
    paidParticipantIds: prunePaidParticipantIds(snapshot),
  };
}

function areStringArraysEqual(first: string[], second: string[]) {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

export function hasSavedSplitChanges(draft: DraftSplit, split: SavedSplit) {
  const title = draft.title.trim();

  if (
    title !== split.title ||
    draft.payerId !== split.payerId ||
    draft.splitMode !== split.splitMode ||
    draft.billSubtotalCents !== split.billSubtotalCents ||
    draft.taxCents !== split.taxCents ||
    draft.tipCents !== split.tipCents ||
    draft.taxAllocationMode !== split.taxAllocationMode ||
    draft.tipAllocationMode !== split.tipAllocationMode ||
    draft.participants.length !== split.participants.length ||
    draft.items.length !== split.items.length
  ) {
    return true;
  }

  const participantsMatch = draft.participants.every((participant, index) => {
    const savedParticipant = split.participants[index];
    return participant.id === savedParticipant.id && participant.name === savedParticipant.name;
  });

  if (!participantsMatch) {
    return true;
  }

  return draft.items.some((item, index) => {
    const savedItem = split.items[index];

    return (
      item.id !== savedItem.id ||
      item.name !== savedItem.name ||
      item.amountCents !== savedItem.amountCents ||
      !areStringArraysEqual(item.participantIds, savedItem.participantIds)
    );
  });
}

export function createDraftFromSavedSplit(split: SavedSplit): DraftSplit {
  return {
    id: createId(),
    sourceSplitId: split.id,
    title: split.title,
    payerId: split.payerId,
    participants: split.participants.map((participant) => ({ ...participant })),
    items: split.items.map((item) => ({
      ...item,
      participantIds: [...item.participantIds],
    })),
    splitMode: split.splitMode,
    billSubtotalCents: split.billSubtotalCents,
    taxCents: split.taxCents,
    tipCents: split.tipCents,
    taxAllocationMode: split.taxAllocationMode,
    tipAllocationMode: split.tipAllocationMode,
    paidParticipantIds: [...split.paidParticipantIds],
    updatedAt: nowIso(),
  };
}
