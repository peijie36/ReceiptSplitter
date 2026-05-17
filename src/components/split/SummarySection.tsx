import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Receipt, Wallet } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { DraftSplit, ParticipantTotals, SplitCalculationResult } from "@/types/split";
import { getDraftValidationErrors } from "@/utils/draftValidation";
import { formatCurrency } from "@/utils/money";
import { calculateFinalTotals } from "@/utils/splitCalculations";

type SummaryContentProps = {
  validationErrors: string[];
  totals: SplitCalculationResult;
  compact?: boolean;
};

function useSummaryData() {
  const draft = useAppStore((state) => state.draft);
  const localEditorIssues = useAppStore((state) => state.localEditorIssues);
  const validationErrors = useMemo(
    () => [...getDraftValidationErrors(draft), ...Object.values(localEditorIssues)],
    [draft, localEditorIssues],
  );
  const totals = useMemo(() => calculateFinalTotals(draft), [draft]);

  return {
    draft,
    validationErrors,
    totals,
  };
}

function getSummaryDescription(draft: DraftSplit) {
  return draft.splitMode === "equal"
    ? "Bill is split evenly in cents."
    : "Totals reconcile to the cent.";
}

type PersonSummaryRowProps = {
  participant: ParticipantTotals;
  label: string;
  amountCents: number;
  expanded: boolean;
  onToggle: () => void;
};

function PersonSummaryRow({ participant, label, amountCents, expanded, onToggle }: PersonSummaryRowProps) {
  const breakdownId = `summary-breakdown-${participant.participantId}`;

  return (
    <div className="rounded-md border border-border/80 bg-background/70">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={breakdownId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-md p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span className="flex min-w-0 items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0 break-words font-medium">{label}</span>
        </span>
        <span className="shrink-0 font-semibold tabular-nums">{formatCurrency(amountCents)}</span>
      </button>
      {expanded ? (
        <div
          id={breakdownId}
          className="grid grid-cols-3 gap-2 border-t border-border/70 px-3 py-2 text-sm text-muted-foreground"
        >
          <span className="min-w-0">
            <span className="block">Subtotal</span>
            <span className="block break-words tabular-nums">{formatCurrency(participant.subtotalCents)}</span>
          </span>
          <span className="min-w-0">
            <span className="block">Tax</span>
            <span className="block break-words tabular-nums">{formatCurrency(participant.taxCents)}</span>
          </span>
          <span className="min-w-0">
            <span className="block">Tip</span>
            <span className="block break-words tabular-nums">{formatCurrency(participant.tipCents)}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}

function SummaryContent({ validationErrors, totals, compact = false }: SummaryContentProps) {
  const [expandedParticipantIds, setExpandedParticipantIds] = useState<string[]>([]);
  const payerTotal = totals.participantTotals.find((participant) => participant.isPayer);
  const participantTotalsById = new Map(
    totals.participantTotals.map((participant) => [participant.participantId, participant]),
  );
  const owedParticipantTotals = totals.owedSummary
    .map((entry) => participantTotalsById.get(entry.participantId))
    .filter((participant): participant is ParticipantTotals => Boolean(participant));

  function toggleParticipantBreakdown(participantId: string) {
    setExpandedParticipantIds((current) =>
      current.includes(participantId)
        ? current.filter((expandedParticipantId) => expandedParticipantId !== participantId)
        : [...current, participantId],
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      {validationErrors.length > 0 ? (
        <Alert>
          <AlertTitle>Draft still needs a few things</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(7.75rem,1fr))] gap-2">
        <div className="min-w-0 rounded-md border border-border bg-secondary/40 p-2.5">
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <Receipt className="h-4 w-4 shrink-0" />
            <span>Subtotal</span>
          </div>
          <div
            className={cn(
              "mt-2 min-w-0 break-words font-semibold leading-tight tabular-nums",
              compact ? "text-lg" : "text-xl",
            )}
          >
            {formatCurrency(totals.subtotalCents)}
          </div>
        </div>
        <div className="min-w-0 rounded-md border border-border bg-secondary/40 p-2.5">
          <div className="text-sm text-muted-foreground">Charges</div>
          <div
            className={cn(
              "mt-2 min-w-0 break-words font-semibold leading-tight tabular-nums",
              compact ? "text-lg" : "text-xl",
            )}
          >
            {formatCurrency(totals.taxCents + totals.tipCents)}
          </div>
        </div>
        <div className="min-w-0 rounded-md border border-border bg-secondary/40 p-2.5">
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4 shrink-0" />
            <span>Grand total</span>
          </div>
          <div
            className={cn(
              "mt-2 min-w-0 break-words font-semibold leading-tight tabular-nums",
              compact ? "text-lg" : "text-xl",
            )}
          >
            {formatCurrency(totals.grandTotalCents)}
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <h3 className="font-medium">Who owes the payer</h3>
          <p className="text-sm text-muted-foreground">Payments go to the payer.</p>
        </div>
        {payerTotal ? (
          <PersonSummaryRow
            participant={payerTotal}
            label={`${payerTotal.participantName} (payer)`}
            amountCents={payerTotal.totalCents}
            expanded={expandedParticipantIds.includes(payerTotal.participantId)}
            onToggle={() => toggleParticipantBreakdown(payerTotal.participantId)}
          />
        ) : null}
        {totals.owedSummary.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
            No reimbursements yet.
          </div>
        ) : (
          <div className="space-y-2">
            {owedParticipantTotals.map((participant) => (
              <PersonSummaryRow
                key={participant.participantId}
                participant={participant}
                label={participant.participantName}
                amountCents={participant.totalCents}
                expanded={expandedParticipantIds.includes(participant.participantId)}
                onToggle={() => toggleParticipantBreakdown(participant.participantId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type SummarySectionProps = {
  className?: string;
};

export function SummarySection({ className }: SummarySectionProps) {
  const { draft, validationErrors, totals } = useSummaryData();

  return (
    <Card className={cn("sticky top-6 min-w-0 w-full", className)}>
      <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
        <CardTitle>Live summary</CardTitle>
        <CardDescription>{getSummaryDescription(draft)}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 p-4 pt-0 sm:p-5 sm:pt-0">
        <SummaryContent validationErrors={validationErrors} totals={totals} />
      </CardContent>
    </Card>
  );
}

type MobileSummaryDockProps = {
  actions?: ReactNode;
};

export function MobileSummaryDock({ actions }: MobileSummaryDockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const summaryDockContentId = "mobile-summary-dock-content";
  const { draft, validationErrors, totals } = useSummaryData();
  const issueLabel =
    validationErrors.length === 1 ? "1 issue to fix" : `${validationErrors.length} issues to fix`;
  const summaryButtonLabel = `Live summary, ${
    validationErrors.length > 0 ? issueLabel : getSummaryDescription(draft)
  }, grand total ${formatCurrency(totals.grandTotalCents)}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 shadow-calm backdrop-blur xl:hidden">
      <div className="mx-auto max-w-7xl px-2 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] pl-[calc(0.5rem+env(safe-area-inset-left))] pr-[calc(0.5rem+env(safe-area-inset-right))] sm:px-4 sm:py-3 sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {actions ? (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-1.5 sm:hidden">
            {actions}
            <button
              type="button"
              aria-label={summaryButtonLabel}
              aria-expanded={isOpen}
              aria-controls={summaryDockContentId}
              onClick={() => setIsOpen((current) => !current)}
              className="flex h-11 min-w-[4.5rem] items-center justify-end gap-1 rounded-md px-1 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span>
                <span className="block text-xs text-muted-foreground">Total</span>
                <span className="block text-sm font-semibold">{formatCurrency(totals.grandTotalCents)}</span>
              </span>
              {isOpen ? <ChevronDown className="h-6 w-6 shrink-0" /> : <ChevronUp className="h-6 w-6 shrink-0" />}
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={summaryDockContentId}
            onClick={() => setIsOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium">Live summary</span>
              <span className="block truncate text-xs text-muted-foreground">
                {validationErrors.length > 0 ? issueLabel : getSummaryDescription(draft)}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <span className="text-right">
                <span className="block text-xs text-muted-foreground">Grand total</span>
                <span className="block font-semibold">{formatCurrency(totals.grandTotalCents)}</span>
              </span>
              {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </span>
          </button>
        )}

        {isOpen ? (
          <div
            id={summaryDockContentId}
            className="mt-3 max-h-[72vh] overflow-y-auto rounded-md border border-border bg-card p-3 sm:p-4"
          >
            <SummaryContent validationErrors={validationErrors} totals={totals} compact />
          </div>
        ) : null}
      </div>
    </div>
  );
}
