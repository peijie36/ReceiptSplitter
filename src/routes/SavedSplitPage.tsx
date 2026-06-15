import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, CheckCircle2, Copy, PencilLine } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency } from "@/utils/money";
import { buildSavedSplitReadModel } from "@/utils/savedSplitReadModel";

type SavedSplitPageProps = {
  splitId: string;
};

function formatSavedDate(isoDate: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

export function SavedSplitPage({ splitId }: SavedSplitPageProps) {
  const navigate = useNavigate();
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const split = useAppStore((state) => state.savedSplits.find((entry) => entry.id === splitId));
  const loadSavedSplitToDraft = useAppStore((state) => state.loadSavedSplitToDraft);
  const toggleSavedSplitParticipantPaid = useAppStore((state) => state.toggleSavedSplitParticipantPaid);

  if (!split) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Split not found</AlertTitle>
        <AlertDescription>
          That saved split is no longer available. Return to <Link className="underline" to="/">home</Link>.
        </AlertDescription>
      </Alert>
    );
  }

  const savedSplit = split;
  const splitModel = buildSavedSplitReadModel(savedSplit);
  const { totals, repaymentStatus, paidParticipantIdSet } = splitModel;

  async function handleCopyPaymentSummary() {
    try {
      await navigator.clipboard.writeText(splitModel.paymentSummaryText);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to saved splits
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{split.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved {formatSavedDate(split.createdAt)} | Updated {formatSavedDate(split.updatedAt)}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            loadSavedSplitToDraft(split.id);
            void navigate({ to: "/split/new" });
          }}
        >
          <PencilLine className="h-4 w-4" />
          Edit
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{split.splitMode === "equal" ? "Bill subtotal" : "Items"}</CardTitle>
              <CardDescription>
                {split.splitMode === "equal"
                  ? "This split used whole-bill equal mode."
                  : "Saved items and assignments."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {split.splitMode === "equal" ? (
                <div className="rounded-xl border border-border/80 bg-background/70 p-4">
                  <div className="text-sm text-muted-foreground">Subtotal before tax and tip</div>
                  <div className="mt-2 text-2xl font-semibold">{formatCurrency(split.billSubtotalCents)}</div>
                </div>
              ) : (
                <ScrollArea className="max-h-[420px]">
                  <div className="space-y-3 pr-3">
                    {splitModel.itemSummaries.map((item) => (
                      <div key={item.id} className="rounded-xl border border-border/80 bg-background/70 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="break-words font-medium">{item.name}</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {item.participantNames.join(", ")}
                            </div>
                          </div>
                          <div className="shrink-0 text-lg font-semibold">{formatCurrency(item.amountCents)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Split settings</CardTitle>
              <CardDescription>Saved tax and tip settings.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="text-sm text-muted-foreground">Split mode</div>
                <div className="mt-1 font-medium">
                  {split.splitMode === "equal" ? "Whole bill equally" : "Itemized"}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="text-sm text-muted-foreground">Tax allocation</div>
                <div className="mt-1 font-medium capitalize">
                  {split.splitMode === "equal" ? "equal" : split.taxAllocationMode}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="text-sm text-muted-foreground">Tip allocation</div>
                <div className="mt-1 font-medium capitalize">
                  {split.splitMode === "equal" ? "equal" : split.tipAllocationMode}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="sticky top-6">
          <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Saved summary</CardTitle>
              <CardDescription>Totals, owed amounts, and repayment status.</CardDescription>
            </div>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                  repaymentStatus.isCompleted
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-border bg-secondary/60 text-muted-foreground",
                )}
                role="status"
              >
                {repaymentStatus.isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                {repaymentStatus.isCompleted
                  ? "Completed"
                  : `${repaymentStatus.paidCount}/${repaymentStatus.owedCount} paid`}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleCopyPaymentSummary}>
                {copyStatus === "copied" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copyStatus === "copied" ? "Copied" : "Copy summary"}
              </Button>
              {copyStatus === "error" ? (
                <p className="text-xs text-destructive" role="status">
                  Unable to copy. Try again.
                </p>
              ) : copyStatus === "copied" ? (
                <p className="text-xs text-muted-foreground" role="status">
                  Payment summary copied.
                </p>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-secondary/40 p-3.5">
                <div className="text-sm text-muted-foreground">Subtotal</div>
                <div className="mt-2 text-2xl font-semibold">{formatCurrency(totals.subtotalCents)}</div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-3.5">
                <div className="text-sm text-muted-foreground">Tax + Tip</div>
                <div className="mt-2 text-2xl font-semibold">
                  {formatCurrency(totals.taxCents + totals.tipCents)}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-3.5">
                <div className="text-sm text-muted-foreground">Grand total</div>
                <div className="mt-2 text-2xl font-semibold">{formatCurrency(totals.grandTotalCents)}</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <h3 className="font-medium">Per-person totals</h3>
                <p className="text-sm text-muted-foreground">Subtotal, tax, and tip by person.</p>
              </div>
              <ScrollArea className="max-h-[320px]">
                <div className="space-y-3 pr-3">
                  {totals.participantTotals.map((participant) => (
                    <div key={participant.participantId} className="rounded-xl border border-border/80 bg-background/70 p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="break-words font-medium">
                            {participant.participantName}
                            {participant.isPayer ? " (payer)" : ""}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Subtotal {formatCurrency(participant.subtotalCents)} | Tax {formatCurrency(participant.taxCents)} | Tip{" "}
                            {formatCurrency(participant.tipCents)}
                          </div>
                        </div>
                        <div className="shrink-0 text-lg font-semibold">{formatCurrency(participant.totalCents)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-medium">Who owes the payer</h3>
              {totals.owedSummary.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-secondary/40 p-3.5 text-sm text-muted-foreground">
                  No reimbursements are due for this split.
                </div>
              ) : (
                totals.owedSummary.map((entry) => {
                  const isPaid = paidParticipantIdSet.has(entry.participantId);

                  return (
                    <div
                      key={entry.participantId}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/70 p-3.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <button
                          type="button"
                          aria-pressed={isPaid}
                          aria-label={`Mark ${entry.participantName} as ${isPaid ? "unpaid" : "paid"}`}
                          onClick={() => toggleSavedSplitParticipantPaid(split.id, entry.participantId)}
                          className={cn(
                            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            isPaid
                              ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                              : "border-border bg-background text-transparent hover:border-emerald-500 hover:text-emerald-600",
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <span className="min-w-0 break-words font-medium">{entry.participantName}</span>
                      </div>
                      <span className="shrink-0 text-lg font-semibold">{formatCurrency(entry.owedCents)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
