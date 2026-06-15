import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, History, Trash2 } from "lucide-react";

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
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store/useAppStore";
import type { SavedSplit } from "@/types/split";
import { formatShortDateTime } from "@/utils/date";
import { formatCurrency } from "@/utils/money";
import { buildSavedSplitReadModel } from "@/utils/savedSplitReadModel";

export function SavedSplitHistory() {
  const navigate = useNavigate();
  const savedSplits = useAppStore((state) => state.savedSplits);
  const loadSavedSplitToDraft = useAppStore((state) => state.loadSavedSplitToDraft);
  const deleteSavedSplit = useAppStore((state) => state.deleteSavedSplit);

  function handleEdit(splitId: string) {
    loadSavedSplitToDraft(splitId);
    void navigate({ to: "/split/new" });
  }

  return (
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
            {savedSplits.map((split) => (
              <SavedSplitCard
                key={split.id}
                split={split}
                onEdit={handleEdit}
                onDelete={deleteSavedSplit}
                onView={(splitId) => void navigate({ to: "/split/$splitId", params: { splitId } })}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </section>
  );
}

type SavedSplitCardProps = {
  split: SavedSplit;
  onEdit: (splitId: string) => void;
  onDelete: (splitId: string) => void;
  onView: (splitId: string) => void;
};

function SavedSplitCard({ split, onEdit, onDelete, onView }: SavedSplitCardProps) {
  const splitModel = useMemo(() => buildSavedSplitReadModel(split), [split]);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-lg font-semibold">{split.title}</div>
            <span
              className={
                splitModel.repaymentStatus.isCompleted
                  ? "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                  : "inline-flex items-center rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-xs font-medium text-muted-foreground"
              }
            >
              {splitModel.repaymentStatus.isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
              {splitModel.repaymentStatus.isCompleted
                ? "Completed"
                : `${splitModel.repaymentStatus.paidCount}/${splitModel.repaymentStatus.owedCount} paid`}
            </span>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Saved {formatShortDateTime(split.createdAt)} | {split.participants.length} participants |{" "}
            {formatCurrency(splitModel.totalCents)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => onView(split.id)}>
            View
          </Button>
          <Button type="button" variant="outline" onClick={() => onEdit(split.id)}>
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
                <AlertDialogAction onClick={() => onDelete(split.id)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
