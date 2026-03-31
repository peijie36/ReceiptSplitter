import type { DraftSplit, SavedSplit } from "@/types/split";
import { createId } from "@/utils/id";

function nowIso() {
  return new Date().toISOString();
}

export function createEmptyDraft(): DraftSplit {
  return {
    id: createId(),
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

export function createSnapshotFromDraft(draft: DraftSplit): SavedSplit {
  const timestamp = nowIso();

  if (!draft.payerId) {
    throw new Error("Cannot save a draft without a payer.");
  }

  return {
    ...draft,
    id: createId(),
    title: getSavedSplitTitle(draft.title, timestamp),
    payerId: draft.payerId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createDraftFromSavedSplit(split: SavedSplit): DraftSplit {
  return {
    id: createId(),
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
    updatedAt: nowIso(),
  };
}
