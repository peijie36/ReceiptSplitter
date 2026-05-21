import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, History, PencilLine, PlusCircle, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store/useAppStore";
import { hasDraftContent } from "@/utils/draft";
import { formatCurrency } from "@/utils/money";
import { getRepaymentStatus } from "@/utils/repaymentStatus";
import { getSavedSplitTotal } from "@/utils/splitCalculations";

function formatSavedDate(isoDate: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

export function HomePage() {
  const navigate = useNavigate();
  const draft = useAppStore((state) => state.draft);
  const savedSplits = useAppStore((state) => state.savedSplits);
  const resetDraft = useAppStore((state) => state.resetDraft);
  const loadSavedSplitToDraft = useAppStore((state) => state.loadSavedSplitToDraft);
  const deleteSavedSplit = useAppStore((state) => state.deleteSavedSplit);

  const draftExists = hasDraftContent(draft);

  function handleStartFresh() {
    resetDraft();
    void navigate({ to: "/split/new" });
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-none bg-primary text-primary-foreground">
          <CardHeader className="pb-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Split the bill without splitting focus.
            </h1>
            <CardDescription className="max-w-2xl text-primary-foreground/80">
              Add participants, assign line items, apply tax and tip, then see exactly who owes the payer.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 pb-6">
            {draftExists ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="secondary">
                    <PlusCircle className="h-4 w-4" />
                    Start fresh split
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset the current draft?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This clears the unsaved working draft before starting a new split. Saved snapshots will stay in history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStartFresh}>Start fresh</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button type="button" variant="secondary" onClick={handleStartFresh}>
                <PlusCircle className="h-4 w-4" />
                Start fresh split
              </Button>
            )}
            {draftExists ? (
              <Button type="button" variant="outline" onClick={() => void navigate({ to: "/split/new" })}>
                <PencilLine className="h-4 w-4" />
                Resume current draft
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold tracking-tight">Current draft</h2>
            <CardDescription>Keep going from where you left off, or start clean.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <div className="text-sm text-muted-foreground">Title</div>
              <div className="mt-1 font-medium">{draft.title.trim() || "Untitled draft"}</div>
            </div>
            <div className="text-xs text-muted-foreground">Autosaved {formatSavedDate(draft.updatedAt)}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-secondary/50 p-4">
                <div className="text-sm text-muted-foreground">Participants</div>
                <div className="mt-1 text-2xl font-semibold">{draft.participants.length}</div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/50 p-4">
                <div className="text-sm text-muted-foreground">Items</div>
                <div className="mt-1 text-2xl font-semibold">{draft.items.length}</div>
              </div>
            </div>
            <Button className="w-full" type="button" onClick={() => void navigate({ to: "/split/new" })}>
              Open editor
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <History className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-xl font-semibold">Recent saved splits</h2>
            <p className="text-sm text-muted-foreground">Saved splits sorted most recent updated first.</p>
          </div>
        </div>

        {savedSplits.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No saved splits yet. Save a completed draft to keep a history.
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="max-h-[540px] rounded-2xl">
            <div className="space-y-4 pr-3">
              {savedSplits.map((split) => {
                const repaymentStatus = getRepaymentStatus(split);

                return (
                  <Card key={split.id}>
                    <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-lg font-semibold">{split.title}</div>
                          <span
                            className={
                              repaymentStatus.isCompleted
                                ? "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                                : "inline-flex items-center rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-xs font-medium text-muted-foreground"
                            }
                          >
                            {repaymentStatus.isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                            {repaymentStatus.isCompleted
                              ? "Completed"
                              : `${repaymentStatus.paidCount}/${repaymentStatus.owedCount} paid`}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          Saved {formatSavedDate(split.createdAt)} | {split.participants.length} participants |{" "}
                          {formatCurrency(getSavedSplitTotal(split))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => void navigate({ to: "/split/$splitId", params: { splitId: split.id } })}
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            loadSavedSplitToDraft(split.id);
                            void navigate({ to: "/split/new" });
                          }}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button type="button" variant="ghost">
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete saved split?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This removes the saved snapshot from local history only. The current draft is not affected.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteSavedSplit(split.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </section>
    </div>
  );
}
