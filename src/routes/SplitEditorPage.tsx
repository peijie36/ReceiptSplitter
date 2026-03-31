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
import { SummarySection } from "@/components/split/SummarySection";
import { useAppStore } from "@/store/useAppStore";
import type { SplitMode } from "@/types/split";
import { getDraftValidationErrors } from "@/utils/draftValidation";

export function SplitEditorPage() {
  const navigate = useNavigate();
  const draft = useAppStore((state) => state.draft);
  const setDraftTitle = useAppStore((state) => state.setDraftTitle);
  const setSplitMode = useAppStore((state) => state.setSplitMode);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const resetDraft = useAppStore((state) => state.resetDraft);

  const validationErrors = getDraftValidationErrors(draft);
  const canSave = validationErrors.length === 0;

  function handleSave() {
    const result = saveDraft();

    if (result.ok && result.splitId) {
      void navigate({ to: "/split/$splitId", params: { splitId: result.splitId } });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card/80 p-6 shadow-calm lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full max-w-2xl space-y-2">
          <Label htmlFor="split-title">Split title</Label>
          <Input
            id="split-title"
            value={draft.title}
            onChange={(event) => setDraftTitle(event.target.value)}
            placeholder="Team dinner at Colibri"
          />
          <p className="text-sm text-muted-foreground">
            Leave this blank if you want the app to generate a timestamp-based title on save.
          </p>
          <div className="space-y-2 pt-2">
            <Label>Split mode</Label>
            <RadioGroup
              className="grid gap-3 md:grid-cols-2"
              value={draft.splitMode}
              onValueChange={(value) => setSplitMode(value as SplitMode)}
            >
              <label className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-4">
                <RadioGroupItem className="mt-1" value="itemized" id="split-mode-itemized" />
                <span className="space-y-1">
                  <span className="block font-medium">Itemized split</span>
                  <span className="block text-sm text-muted-foreground">
                    Assign line items to specific participants, then allocate tax and tip.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-4">
                <RadioGroupItem className="mt-1" value="equal" id="split-mode-equal" />
                <span className="space-y-1">
                  <span className="block font-medium">Split whole bill equally</span>
                  <span className="block text-sm text-muted-foreground">
                    Enter one subtotal and divide subtotal, tax, and tip evenly across everyone.
                  </span>
                </span>
              </label>
            </RadioGroup>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline">
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
                <AlertDialogAction
                  onClick={() => {
                    resetDraft();
                    void navigate({ to: "/" });
                  }}
                >
                  Reset draft
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            Save split
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <ParticipantSection />
          <ItemSection />
          <ChargeSection />
        </div>
        <SummarySection />
      </div>
    </div>
  );
}
