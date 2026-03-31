import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  ActionResult,
  AllocationMode,
  DraftSplit,
  Item,
  SaveDraftResult,
  SavedSplit,
  SplitMode,
} from "@/types/split";
import { createDraftFromSavedSplit, createEmptyDraft, createSnapshotFromDraft, touchDraft } from "@/utils/draft";
import { createId } from "@/utils/id";
import { getDraftValidationErrors, normalizeName, validateItemInput, validateParticipantName } from "@/utils/draftValidation";

type ItemInput = {
  name: string;
  amountCents: number;
  participantIds: string[];
};

type AppStore = {
  draft: DraftSplit;
  savedSplits: SavedSplit[];
  setDraftTitle: (title: string) => void;
  setSplitMode: (mode: SplitMode) => void;
  setPayer: (participantId: string) => ActionResult;
  addParticipant: (name: string) => ActionResult;
  updateParticipantName: (participantId: string, name: string) => ActionResult;
  removeParticipant: (participantId: string) => ActionResult;
  addItem: (input: ItemInput) => ActionResult;
  updateItem: (itemId: string, input: ItemInput) => ActionResult;
  removeItem: (itemId: string) => void;
  setBillSubtotalCents: (billSubtotalCents: number) => ActionResult;
  setTaxCents: (taxCents: number) => ActionResult;
  setTipCents: (tipCents: number) => ActionResult;
  setTaxAllocationMode: (mode: AllocationMode) => void;
  setTipAllocationMode: (mode: AllocationMode) => void;
  resetDraft: () => void;
  saveDraft: () => SaveDraftResult;
  loadSavedSplitToDraft: (splitId: string) => ActionResult;
  deleteSavedSplit: (splitId: string) => void;
};

function success(): ActionResult {
  return { ok: true };
}

function failure(error: string): ActionResult {
  return { ok: false, error };
}

function getParticipantRemovalError(draft: DraftSplit, participantId: string) {
  if (draft.payerId === participantId) {
    return "Choose a different payer before removing this participant.";
  }

  const soleAssignment = draft.items.find(
    (item) => item.participantIds.includes(participantId) && item.participantIds.length === 1,
  );

  if (soleAssignment) {
    return "Reassign any items that only belong to this participant before removing them.";
  }

  return undefined;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      draft: createEmptyDraft(),
      savedSplits: [],
      setDraftTitle: (title) => {
        set((state) => ({
          draft: touchDraft({
            ...state.draft,
            title,
          }),
        }));
      },
      setSplitMode: (mode) => {
        set((state) => ({
          draft: touchDraft({
            ...state.draft,
            splitMode: mode,
          }),
        }));
      },
      setPayer: (participantId) => {
        const participantExists = get().draft.participants.some((participant) => participant.id === participantId);

        if (!participantExists) {
          return failure("Select a valid participant as the payer.");
        }

        set((state) => ({
          draft: touchDraft({
            ...state.draft,
            payerId: participantId,
          }),
        }));

        return success();
      },
      addParticipant: (name) => {
        const draft = get().draft;
        const error = validateParticipantName(draft.participants, name);

        if (error) {
          return failure(error);
        }

        const participantId = createId();
        const nextParticipants = [...draft.participants, { id: participantId, name: normalizeName(name) }];

        set((state) => ({
          draft: touchDraft({
            ...state.draft,
            participants: nextParticipants,
            payerId: state.draft.payerId ?? participantId,
          }),
        }));

        return success();
      },
      updateParticipantName: (participantId, name) => {
        const draft = get().draft;
        const error = validateParticipantName(draft.participants, name, participantId);

        if (error) {
          return failure(error);
        }

        set((state) => ({
          draft: touchDraft({
            ...state.draft,
            participants: state.draft.participants.map((participant) =>
              participant.id === participantId ? { ...participant, name: normalizeName(name) } : participant,
            ),
          }),
        }));

        return success();
      },
      removeParticipant: (participantId) => {
        const draft = get().draft;
        const error = getParticipantRemovalError(draft, participantId);

        if (error) {
          return failure(error);
        }

        set((state) => ({
          draft: touchDraft({
            ...state.draft,
            participants: state.draft.participants.filter((participant) => participant.id !== participantId),
            items: state.draft.items.map((item) => ({
              ...item,
              participantIds: item.participantIds.filter((assignedId) => assignedId !== participantId),
            })),
          }),
        }));

        return success();
      },
      addItem: (input) => {
        const draft = get().draft;
        const error = validateItemInput(
          {
            name: input.name,
            amountCents: input.amountCents,
            participantIds: input.participantIds,
          },
          draft.participants,
        );

        if (error) {
          return failure(error);
        }

        const nextItem: Item = {
          id: createId(),
          name: normalizeName(input.name),
          amountCents: input.amountCents,
          participantIds: [...input.participantIds],
        };

        set((state) => ({
          draft: touchDraft({
            ...state.draft,
            items: [...state.draft.items, nextItem],
          }),
        }));

        return success();
      },
      updateItem: (itemId, input) => {
        const draft = get().draft;
        const error = validateItemInput(
          {
            name: input.name,
            amountCents: input.amountCents,
            participantIds: input.participantIds,
          },
          draft.participants,
        );

        if (error) {
          return failure(error);
        }

        set((state) => ({
          draft: touchDraft({
            ...state.draft,
            items: state.draft.items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    name: normalizeName(input.name),
                    amountCents: input.amountCents,
                    participantIds: [...input.participantIds],
                  }
                : item,
            ),
          }),
        }));

        return success();
      },
      removeItem: (itemId) => {
        set((state) => ({
          draft: touchDraft({
            ...state.draft,
            items: state.draft.items.filter((item) => item.id !== itemId),
          }),
        }));
      },
      setBillSubtotalCents: (billSubtotalCents) => {
        if (billSubtotalCents < 0) {
          return failure("Subtotal cannot be negative.");
        }

        set((state) => ({
          draft: touchDraft({
            ...state.draft,
            billSubtotalCents,
          }),
        }));

        return success();
      },
      setTaxCents: (taxCents) => {
        if (taxCents < 0) {
          return failure("Tax cannot be negative.");
        }

        set((state) => ({
          draft: touchDraft({
            ...state.draft,
            taxCents,
          }),
        }));

        return success();
      },
      setTipCents: (tipCents) => {
        if (tipCents < 0) {
          return failure("Tip cannot be negative.");
        }

        set((state) => ({
          draft: touchDraft({
            ...state.draft,
            tipCents,
          }),
        }));

        return success();
      },
      setTaxAllocationMode: (mode) => {
        set((state) => ({
          draft: touchDraft({
            ...state.draft,
            taxAllocationMode: mode,
          }),
        }));
      },
      setTipAllocationMode: (mode) => {
        set((state) => ({
          draft: touchDraft({
            ...state.draft,
            tipAllocationMode: mode,
          }),
        }));
      },
      resetDraft: () => {
        set({
          draft: createEmptyDraft(),
        });
      },
      saveDraft: () => {
        const draft = get().draft;
        const errors = getDraftValidationErrors(draft);

        if (errors.length > 0) {
          return {
            ok: false,
            error: errors[0],
          };
        }

        const snapshot = createSnapshotFromDraft(draft);

        set((state) => ({
          draft: createEmptyDraft(),
          savedSplits: [snapshot, ...state.savedSplits],
        }));

        return {
          ok: true,
          splitId: snapshot.id,
        };
      },
      loadSavedSplitToDraft: (splitId) => {
        const split = get().savedSplits.find((savedSplit) => savedSplit.id === splitId);

        if (!split) {
          return failure("That saved split no longer exists.");
        }

        set({
          draft: createDraftFromSavedSplit(split),
        });

        return success();
      },
      deleteSavedSplit: (splitId) => {
        set((state) => ({
          savedSplits: state.savedSplits.filter((split) => split.id !== splitId),
        }));
      },
    }),
    {
      name: "receipt-splitter-store",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        draft: state.draft,
        savedSplits: state.savedSplits,
      }),
    },
  ),
);

export function getSaveError() {
  const errors = getDraftValidationErrors(useAppStore.getState().draft);
  return errors[0];
}
