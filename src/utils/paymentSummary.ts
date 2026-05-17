import type { SavedSplit } from "@/types/split";
import { formatCurrency } from "@/utils/money";
import { calculateFinalTotals } from "@/utils/splitCalculations";

function formatPaymentSummaryDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(isoDate));
}

export function buildPaymentSummaryText(split: SavedSplit) {
  const totals = calculateFinalTotals(split);
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
