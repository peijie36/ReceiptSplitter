import type { DraftSplit, SplitCalculationResult } from "@/types/split";
import { getDraftValidationErrors } from "@/utils/draftValidation";
import { calculateFinalTotals } from "@/utils/splitCalculations";

export type DraftSummaryReadModel = {
  validationErrors: string[];
  canSave: boolean;
  issueLabel: string;
  summaryDescription: string;
  totals: SplitCalculationResult;
};

export function getDraftSummaryDescription(draft: Pick<DraftSplit, "splitMode">) {
  return draft.splitMode === "equal"
    ? "Bill is split evenly in cents."
    : "Totals reconcile to the cent.";
}

export function getDraftIssueLabel(issueCount: number) {
  return issueCount === 1 ? "1 issue to fix before saving" : `${issueCount} issues to fix before saving`;
}

export function buildDraftSummaryReadModel(
  draft: DraftSplit,
  localEditorIssues: Record<string, string>,
): DraftSummaryReadModel {
  const validationErrors = [...getDraftValidationErrors(draft), ...Object.values(localEditorIssues)];

  return {
    validationErrors,
    canSave: validationErrors.length === 0,
    issueLabel: getDraftIssueLabel(validationErrors.length),
    summaryDescription: getDraftSummaryDescription(draft),
    totals: calculateFinalTotals(draft),
  };
}
