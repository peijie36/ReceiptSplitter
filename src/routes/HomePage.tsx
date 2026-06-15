import { useNavigate } from "@tanstack/react-router";
import { PencilLine, PlusCircle } from "lucide-react";

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
import { SavedSplitHistory } from "@/components/home/SavedSplitHistory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { formatShortDateTime } from "@/utils/date";

export function HomePage() {
  return (
    <div className="space-y-8">
      <CurrentDraftSection />
      <SavedSplitHistory />
    </div>
  );
}

function CurrentDraftSection() {
  const navigate = useNavigate();
  const title = useAppStore((state) => state.draft.title);
  const updatedAt = useAppStore((state) => state.draft.updatedAt);
  const splitMode = useAppStore((state) => state.draft.splitMode);
  const participantCount = useAppStore((state) => state.draft.participants.length);
  const itemCount = useAppStore((state) => state.draft.items.length);
  const billSubtotalCents = useAppStore((state) => state.draft.billSubtotalCents);
  const taxCents = useAppStore((state) => state.draft.taxCents);
  const tipCents = useAppStore((state) => state.draft.tipCents);
  const resetDraft = useAppStore((state) => state.resetDraft);

  const draftExists =
    title.trim().length > 0 ||
    splitMode !== "itemized" ||
    participantCount > 0 ||
    itemCount > 0 ||
    billSubtotalCents > 0 ||
    taxCents > 0 ||
    tipCents > 0;

  function handleStartFresh() {
    resetDraft();
    void navigate({ to: "/split/new" });
  }

  return (
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
            <div className="mt-1 font-medium">{title.trim() || "Untitled draft"}</div>
          </div>
          <div className="text-xs text-muted-foreground">Autosaved {formatShortDateTime(updatedAt)}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <div className="text-sm text-muted-foreground">Participants</div>
              <div className="mt-1 text-2xl font-semibold">{participantCount}</div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <div className="text-sm text-muted-foreground">Items</div>
              <div className="mt-1 text-2xl font-semibold">{itemCount}</div>
            </div>
          </div>
          <Button className="w-full" type="button" onClick={() => void navigate({ to: "/split/new" })}>
            Open editor
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
