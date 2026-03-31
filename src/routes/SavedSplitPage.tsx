import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, PencilLine } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency } from "@/utils/money";
import { calculateFinalTotals, getItemParticipantNames } from "@/utils/splitCalculations";

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
  const split = useAppStore((state) => state.savedSplits.find((entry) => entry.id === splitId));
  const loadSavedSplitToDraft = useAppStore((state) => state.loadSavedSplitToDraft);

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

  const totals = calculateFinalTotals(split);

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
          Edit copy
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
                  : "Saved line items and their participant assignments."}
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
                    {split.items.map((item) => (
                      <div key={item.id} className="rounded-xl border border-border/80 bg-background/70 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {getItemParticipantNames(item, split.participants).join(", ")}
                            </div>
                          </div>
                          <div className="text-lg font-semibold">{formatCurrency(item.amountCents)}</div>
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
              <CardDescription>Saved allocation choices for tax and tip.</CardDescription>
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
          <CardHeader>
            <CardTitle>Saved summary</CardTitle>
            <CardDescription>Per-person totals and the final owed list.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="text-sm text-muted-foreground">Subtotal</div>
                <div className="mt-2 text-2xl font-semibold">{formatCurrency(totals.subtotalCents)}</div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="text-sm text-muted-foreground">Tax + Tip</div>
                <div className="mt-2 text-2xl font-semibold">
                  {formatCurrency(totals.taxCents + totals.tipCents)}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="text-sm text-muted-foreground">Grand total</div>
                <div className="mt-2 text-2xl font-semibold">{formatCurrency(totals.grandTotalCents)}</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              {totals.participantTotals.map((participant) => (
                <div key={participant.participantId} className="rounded-xl border border-border/80 bg-background/70 p-4">
                  <div className="flex items-center justify-between gap-3">
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
                    <div className="text-lg font-semibold">{formatCurrency(participant.totalCents)}</div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-medium">Who owes the payer</h3>
              {totals.owedSummary.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
                  No reimbursements are due for this split.
                </div>
              ) : (
                totals.owedSummary.map((entry) => (
                  <div key={entry.participantId} className="flex items-center justify-between rounded-xl border border-border/80 bg-background/70 p-4">
                    <span className="font-medium">{entry.participantName}</span>
                    <span className="text-lg font-semibold">{formatCurrency(entry.owedCents)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
