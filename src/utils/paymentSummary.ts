import type { SavedSplit, SplitCalculationResult } from "@/types/split";
import { formatCurrency } from "@/utils/money";
import { calculateFinalTotals } from "@/utils/splitCalculations";

function formatPaymentSummaryDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(isoDate));
}

export function buildPaymentSummaryTextFromTotals(split: SavedSplit, totals: SplitCalculationResult) {
  const payerName =
    totals.participantTotals.find((participant) => participant.isPayer)?.participantName ?? "the payer";
  const title = `${split.title} - ${formatPaymentSummaryDate(split.createdAt)}`;

  if (totals.owedSummary.length === 0) {
    return `${title}\n\nNo reimbursements are due.`;
  }

  return [
    title,
    "",
    `Pay ${payerName}:`,
    ...totals.owedSummary.map(
      (entry) => `${entry.participantName} owes ${payerName} ${formatCurrency(entry.owedCents)}`,
    ),
  ].join("\n");
}

export function buildPaymentSummaryText(split: SavedSplit) {
  return buildPaymentSummaryTextFromTotals(split, calculateFinalTotals(split));
}
