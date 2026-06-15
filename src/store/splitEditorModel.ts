import { useCallback, useMemo } from "react";

import { useAppStore } from "@/store/useAppStore";
import { buildDraftSummaryReadModel } from "@/utils/draftSummary";

const BILL_SUBTOTAL_ISSUE_KEY = "billSubtotal";
const TAX_ISSUE_KEY = "tax";
const TIP_ISSUE_KEY = "tip";

function getParticipantIssueKey(participantId: string) {
  return `participant:${participantId}`;
}

function getItemIssueKey(itemId: string) {
  return `item:${itemId}`;
}

export function useDraftSummaryModel() {
  const draft = useAppStore((state) => state.draft);
  const localEditorIssues = useAppStore((state) => state.localEditorIssues);

  return useMemo(
    () => buildDraftSummaryReadModel(draft, localEditorIssues),
    [draft, localEditorIssues],
  );
}

export function useParticipantEditorModel() {
  const participants = useAppStore((state) => state.draft.participants);
  const payerId = useAppStore((state) => state.draft.payerId);
  const addParticipant = useAppStore((state) => state.addParticipant);
  const updateParticipantName = useAppStore((state) => state.updateParticipantName);
  const removeParticipant = useAppStore((state) => state.removeParticipant);
  const setPayer = useAppStore((state) => state.setPayer);
  const setLocalEditorIssue = useAppStore((state) => state.setLocalEditorIssue);
  const setParticipantIssue = useCallback(
    (participantId: string, error?: string) => setLocalEditorIssue(getParticipantIssueKey(participantId), error),
    [setLocalEditorIssue],
  );

  return {
    draft: {
      participants,
      payerId,
    },
    addParticipant,
    updateParticipantName,
    removeParticipant,
    setPayer,
    setParticipantIssue,
  };
}

export function useItemActionsModel() {
  const updateItem = useAppStore((state) => state.updateItem);
  const removeItem = useAppStore((state) => state.removeItem);
  const setLocalEditorIssue = useAppStore((state) => state.setLocalEditorIssue);
  const setItemIssue = useCallback(
    (itemId: string, error?: string) => setLocalEditorIssue(getItemIssueKey(itemId), error),
    [setLocalEditorIssue],
  );

  return {
    updateItem,
    removeItem,
    setItemIssue,
  };
}

export function useItemEditorModel() {
  const splitMode = useAppStore((state) => state.draft.splitMode);
  const participants = useAppStore((state) => state.draft.participants);
  const items = useAppStore((state) => state.draft.items);
  const billSubtotalCents = useAppStore((state) => state.draft.billSubtotalCents);
  const addItem = useAppStore((state) => state.addItem);
  const setBillSubtotalCents = useAppStore((state) => state.setBillSubtotalCents);
  const setLocalEditorIssue = useAppStore((state) => state.setLocalEditorIssue);
  const setBillSubtotalIssue = useCallback(
    (error?: string) => setLocalEditorIssue(BILL_SUBTOTAL_ISSUE_KEY, error),
    [setLocalEditorIssue],
  );

  return {
    draft: {
      splitMode,
      participants,
      items,
      billSubtotalCents,
    },
    addItem,
    setBillSubtotalCents,
    setBillSubtotalIssue,
  };
}

export function useChargeEditorModel() {
  const splitMode = useAppStore((state) => state.draft.splitMode);
  const taxCents = useAppStore((state) => state.draft.taxCents);
  const tipCents = useAppStore((state) => state.draft.tipCents);
  const taxAllocationMode = useAppStore((state) => state.draft.taxAllocationMode);
  const tipAllocationMode = useAppStore((state) => state.draft.tipAllocationMode);
  const setTaxCents = useAppStore((state) => state.setTaxCents);
  const setTipCents = useAppStore((state) => state.setTipCents);
  const setTaxAllocationMode = useAppStore((state) => state.setTaxAllocationMode);
  const setTipAllocationMode = useAppStore((state) => state.setTipAllocationMode);
  const setLocalEditorIssue = useAppStore((state) => state.setLocalEditorIssue);
  const setTaxIssue = useCallback((error?: string) => setLocalEditorIssue(TAX_ISSUE_KEY, error), [setLocalEditorIssue]);
  const setTipIssue = useCallback((error?: string) => setLocalEditorIssue(TIP_ISSUE_KEY, error), [setLocalEditorIssue]);

  return {
    draft: {
      splitMode,
      taxCents,
      tipCents,
      taxAllocationMode,
      tipAllocationMode,
    },
    setTaxCents,
    setTipCents,
    setTaxAllocationMode,
    setTipAllocationMode,
    setTaxIssue,
    setTipIssue,
  };
}

export function useSplitHeaderModel() {
  const title = useAppStore((state) => state.draft.title);
  const splitMode = useAppStore((state) => state.draft.splitMode);
  const updatedAt = useAppStore((state) => state.draft.updatedAt);
  const setDraftTitle = useAppStore((state) => state.setDraftTitle);
  const setSplitMode = useAppStore((state) => state.setSplitMode);

  return {
    draft: {
      title,
      splitMode,
      updatedAt,
    },
    setDraftTitle,
    setSplitMode,
  };
}
