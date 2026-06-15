import { useNavigate } from "@tanstack/react-router";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChargeSection } from "@/components/split/ChargeSection";
import { ItemSection } from "@/components/split/ItemSection";
import { ParticipantSection } from "@/components/split/ParticipantSection";
import { MobileSummaryDock, SummarySection } from "@/components/split/SummarySection";
import { useAppStore } from "@/store/useAppStore";
import { useDraftSummaryModel, useSplitHeaderModel } from "@/store/splitEditorModel";
import type { SplitMode } from "@/types/split";

function formatDraftSavedAt(isoDate: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

type DraftActionsProps = {
  canSave: boolean;
  onReset: () => void;
  onSave: () => void;
  className: string;
  buttonClassName: string;
};

function DraftActions({ canSave, onReset, onSave, className, buttonClassName }: DraftActionsProps) {
  return (
    <div className={className}>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" className={buttonClassName}>
            Reset draft
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset the current draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears the unsaved working draft. Saved snapshots will stay in history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onReset}>Reset draft</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button type="button" size="sm" className={buttonClassName} onClick={onSave} disabled={!canSave}>
        Save split
      </Button>
    </div>
  );
}

export function SplitEditorPage() {
  const navigate = useNavigate();
  const saveDraft = useAppStore((state) => state.saveDraft);
  const resetDraft = useAppStore((state) => state.resetDraft);
  const { draft, setDraftTitle, setSplitMode } = useSplitHeaderModel();
  const summaryModel = useDraftSummaryModel();

  function handleSave() {
    const result = saveDraft();

    if (result.ok && result.splitId) {
      void navigate({ to: "/split/$splitId", params: { splitId: result.splitId } });
    }
  }

  function handleReset() {
    resetDraft();
    void navigate({ to: "/" });
  }

  return (
    <div className="space-y-3 pb-24 sm:space-y-5 xl:pb-0">
      <h1 className="sr-only">Create receipt split</h1>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/80 p-3 shadow-calm sm:gap-4 sm:rounded-2xl sm:p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full max-w-2xl space-y-2">
          <Label htmlFor="split-title">Split title</Label>
          <Input
            className="h-9"
            id="split-title"
            value={draft.title}
            onChange={(event) => setDraftTitle(event.target.value)}
            placeholder="Team dinner at Colibri"
          />
          <p className="text-sm text-muted-foreground">
            Leave blank to auto-name on save.
          </p>
          <div className="space-y-2 pt-1">
            <Label>Split mode</Label>
            <RadioGroup
              aria-label="Split mode"
              className="grid gap-2 md:grid-cols-2"
              value={draft.splitMode}
              onValueChange={(value) => setSplitMode(value as SplitMode)}
            >
              <label className="flex items-start gap-3 rounded-lg border border-border bg-background/70 p-2.5 sm:p-3">
                <RadioGroupItem className="mt-1" value="itemized" id="split-mode-itemized" />
                <span className="space-y-1">
                  <span className="block font-medium">Itemized split</span>
                  <span className="block text-sm text-muted-foreground">
                    Assign items, tax, and tip.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-border bg-background/70 p-2.5 sm:p-3">
                <RadioGroupItem className="mt-1" value="equal" id="split-mode-equal" />
                <span className="space-y-1">
                  <span className="block font-medium">Split whole bill equally</span>
                  <span className="block text-sm text-muted-foreground">
                    Split subtotal, tax, and tip evenly.
                  </span>
                </span>
              </label>
            </RadioGroup>
          </div>
        </div>
        <div className="space-y-2 lg:text-right">
          <DraftActions
            canSave={summaryModel.canSave}
            onReset={handleReset}
            onSave={handleSave}
            className="hidden gap-2 sm:flex sm:flex-wrap sm:justify-start lg:justify-end"
            buttonClassName="sm:w-auto"
          />
          <p className="text-xs text-muted-foreground">
            {summaryModel.canSave ? "Ready to save" : summaryModel.issueLabel} | Draft autosaved{" "}
            {formatDraftSavedAt(draft.updatedAt)}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)] xl:items-start">
        <div className="space-y-3 sm:space-y-5">
          <ParticipantSection />
          <ItemSection />
          <ChargeSection />
        </div>
        <SummarySection className="hidden w-full xl:block" summaryModel={summaryModel} />
      </div>
      <MobileSummaryDock
        summaryModel={summaryModel}
        actions={
          <DraftActions
            canSave={summaryModel.canSave}
            onReset={handleReset}
            onSave={handleSave}
            className="contents"
            buttonClassName="w-full px-2"
          />
        }
      />
    </div>
  );
}
