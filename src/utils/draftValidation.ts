import type { DraftSplit, Item, Participant } from "@/types/split";

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function hasDuplicateParticipantName(
  participants: Participant[],
  name: string,
  currentParticipantId?: string,
) {
  const normalizedName = normalizeName(name).toLowerCase();

  return participants.some((participant) => {
    if (participant.id === currentParticipantId) {
      return false;
    }

    return normalizeName(participant.name).toLowerCase() === normalizedName;
  });
}

export function validateParticipantName(
  participants: Participant[],
  name: string,
  currentParticipantId?: string,
) {
  const normalizedName = normalizeName(name);

  if (normalizedName.length === 0) {
    return "Participant name is required.";
  }

  if (hasDuplicateParticipantName(participants, normalizedName, currentParticipantId)) {
    return "Participant names must be unique.";
  }

  return undefined;
}

export function validateItemInput(item: Pick<Item, "name" | "amountCents" | "participantIds">, participants: Participant[]) {
  const normalizedName = normalizeName(item.name);

  if (normalizedName.length === 0) {
    return "Item name is required.";
  }

  if (item.amountCents <= 0) {
    return "Item amount must be greater than zero.";
  }

  if (item.participantIds.length === 0) {
    return "Assign the item to at least one participant.";
  }

  const participantIds = new Set(participants.map((participant) => participant.id));

  if (item.participantIds.some((participantId) => !participantIds.has(participantId))) {
    return "Item has an invalid participant assignment.";
  }

  return undefined;
}

export function getDraftValidationErrors(draft: DraftSplit) {
  const errors: string[] = [];

  if (draft.participants.length === 0) {
    errors.push("Add at least one participant.");
  }

  if (!draft.payerId) {
    errors.push("Choose a payer.");
  }

  if (draft.splitMode === "itemized" && draft.items.length === 0) {
    errors.push("Add at least one item.");
  }

  if (draft.splitMode === "equal" && draft.billSubtotalCents <= 0) {
    errors.push("Enter a subtotal greater than zero.");
  }

  if (draft.taxCents < 0) {
    errors.push("Tax cannot be negative.");
  }

  if (draft.tipCents < 0) {
    errors.push("Tip cannot be negative.");
  }

  for (const participant of draft.participants) {
    const participantError = validateParticipantName(draft.participants, participant.name, participant.id);
    if (participantError) {
      errors.push(participantError);
      break;
    }
  }

  if (draft.splitMode === "itemized") {
    for (const item of draft.items) {
      const itemError = validateItemInput(item, draft.participants);
      if (itemError) {
        errors.push(itemError);
        break;
      }
    }
  }

  return errors;
}

export function isDraftValid(draft: DraftSplit) {
  return getDraftValidationErrors(draft).length === 0;
}
