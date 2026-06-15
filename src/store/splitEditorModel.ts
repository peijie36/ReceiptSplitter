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
  const draft = useAppStore((state) => state.draft);
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
    draft,
    addParticipant,
    updateParticipantName,
    removeParticipant,
    setPayer,
    setParticipantIssue,
  };
}

export function useItemEditorModel() {
  const draft = useAppStore((state) => state.draft);
  const addItem = useAppStore((state) => state.addItem);
  const updateItem = useAppStore((state) => state.updateItem);
  const removeItem = useAppStore((state) => state.removeItem);
  const setBillSubtotalCents = useAppStore((state) => state.setBillSubtotalCents);
  const setLocalEditorIssue = useAppStore((state) => state.setLocalEditorIssue);
  const setItemIssue = useCallback(
    (itemId: string, error?: string) => setLocalEditorIssue(getItemIssueKey(itemId), error),
    [setLocalEditorIssue],
  );
  const setBillSubtotalIssue = useCallback(
    (error?: string) => setLocalEditorIssue(BILL_SUBTOTAL_ISSUE_KEY, error),
    [setLocalEditorIssue],
  );

  return {
    draft,
    addItem,
    updateItem,
    removeItem,
    setBillSubtotalCents,
    setItemIssue,
    setBillSubtotalIssue,
  };
}

export function useChargeEditorModel() {
  const draft = useAppStore((state) => state.draft);
  const setTaxCents = useAppStore((state) => state.setTaxCents);
  const setTipCents = useAppStore((state) => state.setTipCents);
  const setTaxAllocationMode = useAppStore((state) => state.setTaxAllocationMode);
  const setTipAllocationMode = useAppStore((state) => state.setTipAllocationMode);
  const setLocalEditorIssue = useAppStore((state) => state.setLocalEditorIssue);
  const setTaxIssue = useCallback((error?: string) => setLocalEditorIssue(TAX_ISSUE_KEY, error), [setLocalEditorIssue]);
  const setTipIssue = useCallback((error?: string) => setLocalEditorIssue(TIP_ISSUE_KEY, error), [setLocalEditorIssue]);

  return {
    draft,
    setTaxCents,
    setTipCents,
    setTaxAllocationMode,
    setTipAllocationMode,
    setTaxIssue,
    setTipIssue,
  };
}
