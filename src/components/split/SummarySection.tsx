import { Receipt, Wallet } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/useAppStore";
import { getDraftValidationErrors } from "@/utils/draftValidation";
import { formatCurrency } from "@/utils/money";
import { calculateFinalTotals } from "@/utils/splitCalculations";

export function SummarySection() {
  const draft = useAppStore((state) => state.draft);
  const validationErrors = getDraftValidationErrors(draft);
  const totals = calculateFinalTotals(draft);

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Live summary</CardTitle>
        <CardDescription>
          {draft.splitMode === "equal"
            ? "Whole-bill equal mode splits subtotal, tax, and tip evenly in cents."
            : "Everything reconciles in cents and the payer stays out of the owes list."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
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

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Receipt className="h-4 w-4" />
              Subtotal
            </div>
            <div className="mt-2 text-2xl font-semibold">{formatCurrency(totals.subtotalCents)}</div>
          </div>
          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <div className="text-sm text-muted-foreground">Charges</div>
            <div className="mt-2 text-2xl font-semibold">
              {formatCurrency(totals.taxCents + totals.tipCents)}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Grand total
            </div>
            <div className="mt-2 text-2xl font-semibold">{formatCurrency(totals.grandTotalCents)}</div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <h3 className="font-medium">Per-person totals</h3>
            <p className="text-sm text-muted-foreground">Includes subtotal, tax, and tip for every participant.</p>
          </div>
          <div className="max-h-[320px] space-y-3 overflow-y-auto pr-3">
            {totals.participantTotals.map((participant) => (
              <div key={participant.participantId} className="rounded-xl border border-border/80 bg-background/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {participant.participantName}
                      {participant.isPayer ? " (payer)" : ""}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Subtotal {formatCurrency(participant.subtotalCents)} | Tax {formatCurrency(participant.taxCents)} | Tip{" "}
                      {formatCurrency(participant.tipCents)}
                    </div>
                  </div>
                  <div className="text-right text-lg font-semibold">{formatCurrency(participant.totalCents)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <h3 className="font-medium">Who owes the payer</h3>
            <p className="text-sm text-muted-foreground">The payer's own share is included in totals but excluded here.</p>
          </div>
          {totals.owedSummary.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
              No reimbursements yet. Once participants and a payer are set, the owed list appears here.
            </div>
          ) : (
            <div className="space-y-3">
              {totals.owedSummary.map((entry) => (
                <div key={entry.participantId} className="flex items-center justify-between rounded-xl border border-border/80 bg-background/70 p-4">
                  <span className="font-medium">{entry.participantName}</span>
                  <span className="text-lg font-semibold">{formatCurrency(entry.owedCents)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
