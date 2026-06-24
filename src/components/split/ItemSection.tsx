import { useEffect, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { ParticipantAssignmentChips } from "@/components/split/ParticipantAssignmentChips";
import { ReceiptScanner } from "@/features/receipt-scanning/components/ReceiptScanner";
import { cn } from "@/lib/utils";
import { useItemActionsModel, useItemEditorModel } from "@/store/useSplitEditor";
import type { Item, Participant } from "@/types/split";
import { formatCurrency, formatMoneyInput, normalizeMoneyInput, parseMoneyInput } from "@/utils/money";

type ItemFormState = {
  name: string;
  amount: string;
  participantIds: string[];
};

function buildFormState(item?: Item): ItemFormState {
  return {
    name: item?.name ?? "",
    amount: item ? formatMoneyInput(item.amountCents) : "",
    participantIds: item?.participantIds ?? [],
  };
}

type ExistingItemEditorProps = {
  item: Item;
  itemNumber: number;
  participants: Participant[];
};

function ExistingItemEditor({ item, itemNumber, participants }: ExistingItemEditorProps) {
  const { updateItem, removeItem, setItemIssue } = useItemActionsModel();

  const [state, setState] = useState<ItemFormState>(buildFormState(item));
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setState(buildFormState(item));
  }, [item]);

  useEffect(() => {
    return () => setItemIssue(item.id);
  }, [item.id, setItemIssue]);

  function commitChanges(nextState: ItemFormState = state) {
    const parsed = parseMoneyInput(nextState.amount);

    if (parsed.cents === null) {
      const message = parsed.error ?? "Enter a valid item amount.";
      setError(message);
      setIsExpanded(true);
      setItemIssue(item.id, message);
      return false;
    }

    const result = updateItem(item.id, {
      name: nextState.name,
      amountCents: parsed.cents,
      participantIds: nextState.participantIds,
    });

    if (!result.ok) {
      const message = result.error ?? "Unable to update item.";
      setError(message);
      setIsExpanded(true);
      setItemIssue(item.id, message);
      return false;
    }

    setError(null);
    setItemIssue(item.id);
    return true;
  }

  function handleAssignmentChange(participantIds: string[]) {
    const nextState = {
      ...state,
      participantIds,
    };

    setState(nextState);

    if (participantIds.length === 0) {
      const message = "Assign this item to at least one participant before updating.";
      setError(message);
      setIsExpanded(true);
      setItemIssue(item.id, message);
      return;
    }

    commitChanges(nextState);
  }

  function handleCommitOnEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    event.currentTarget.blur();
  }

  const headerName = state.name.trim() || "Untitled item";
  const headerAmount = parseMoneyInput(state.amount).cents;
  const editorId = `existing-item-editor-${item.id}`;
  const assignedParticipantNames = participants
    .filter((participant) => state.participantIds.includes(participant.id))
    .map((participant) => participant.name)
    .join(", ");

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-border/80 bg-background/70">
      <div className="relative flex min-h-11 min-w-0 items-center justify-between gap-3 border-b border-border/70 bg-secondary/30 px-3 py-2">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase text-muted-foreground">Item {itemNumber}</div>
          <div className="truncate font-medium">{headerName}</div>
          <div className="truncate text-xs text-muted-foreground md:hidden">
            {assignedParticipantNames || "No participants assigned"}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-semibold tabular-nums">
            {headerAmount === null ? formatCurrency(item.amountCents) : formatCurrency(headerAmount)}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn("h-4 w-4 transition-transform md:hidden", isExpanded ? "rotate-180" : null)}
          />
        </div>
        <button
          type="button"
          aria-label={`Edit item ${itemNumber}: ${headerName}`}
          aria-expanded={isExpanded}
          aria-controls={editorId}
          onClick={() => {
            if (error) {
              return;
            }

            setIsExpanded((current) => !current);
          }}
          className="absolute inset-0 rounded-t-lg transition-colors hover:bg-secondary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:hidden"
        />
      </div>
      <div
        id={editorId}
        className={cn(
          "min-w-0 gap-2 p-2.5 sm:p-3 md:grid md:grid-cols-[minmax(0,1fr)_9rem]",
          isExpanded ? "grid" : "hidden",
        )}
      >
        <div className="space-y-2">
          <Label htmlFor={`item-name-${item.id}`}>Item</Label>
          <Input
            className="h-9"
            id={`item-name-${item.id}`}
            value={state.name}
            onChange={(event) => {
              setState((current) => ({ ...current, name: event.target.value }));
              setError(null);
              setItemIssue(item.id);
            }}
            onBlur={() => {
              commitChanges();
            }}
            onKeyDown={handleCommitOnEnter}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`item-amount-${item.id}`}>Amount</Label>
          <MoneyInput
            className="h-9"
            id={`item-amount-${item.id}`}
            value={state.amount}
            placeholder="0.00"
            onValueChange={({ displayValue }) => {
              setState((current) => ({ ...current, amount: displayValue }));
              setError(null);
              setItemIssue(item.id);
            }}
            onBlur={() => {
              commitChanges();
            }}
            onKeyDown={handleCommitOnEnter}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label>Assigned to</Label>
          <div className="rounded-md border border-border bg-card p-2 sm:p-2.5">
            <ParticipantAssignmentChips
              participants={participants}
              selectedParticipantIds={state.participantIds}
              onSelectedParticipantIdsChange={handleAssignmentChange}
            />
          </div>
        </div>
        <div className="flex items-end justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setItemIssue(item.id);
              removeItem(item.id);
            }}
            className="w-full"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      {error ? (
        <Alert className="mx-3 mb-3" variant="destructive">
          <AlertTitle>Item issue</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

export function ItemSection() {
  const { draft, addItem, importReceipt, setBillSubtotalCents, setBillSubtotalIssue } = useItemEditorModel();

  const [newItem, setNewItem] = useState<ItemFormState>({
    name: "",
    amount: "",
    participantIds: [],
  });
  const [billSubtotalInput, setBillSubtotalInput] = useState(formatMoneyInput(draft.billSubtotalCents, { emptyWhenZero: true }));
  const [isBillSubtotalFocused, setIsBillSubtotalFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isBillSubtotalFocused) {
      return;
    }

    setBillSubtotalInput(formatMoneyInput(draft.billSubtotalCents, { emptyWhenZero: true }));
  }, [draft.billSubtotalCents, isBillSubtotalFocused]);

  function handleParticipantAssignmentChange(participantIds: string[]) {
    setNewItem((current) => ({
      ...current,
      participantIds,
    }));
    setError(null);
  }

  function handleAddItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseMoneyInput(newItem.amount);

    if (parsed.cents === null) {
      setError(parsed.error ?? "Enter a valid item amount.");
      return;
    }

    const result = addItem({
      name: newItem.name,
      amountCents: parsed.cents,
      participantIds: newItem.participantIds,
    });

    if (!result.ok) {
      setError(result.error ?? "Unable to add item.");
      return;
    }

    setNewItem({
      name: "",
      amount: "",
      participantIds: [],
    });
    setError(null);
  }

  function handleBillSubtotalChange(value: string) {
    const normalized = normalizeMoneyInput(value, { emptyWhenZero: true });
    setBillSubtotalInput(normalized.displayValue);

    if (normalized.cents === null) {
      const message = normalized.error ?? "Enter a valid subtotal.";
      setError(message);
      setBillSubtotalIssue(message);
      return;
    }

    const result = setBillSubtotalCents(normalized.cents);

    if (!result.ok) {
      const message = result.error ?? "Unable to set subtotal.";
      setError(message);
      setBillSubtotalIssue(message);
      return;
    }

    setError(null);
    setBillSubtotalIssue();
  }

  return (
    <Card>
      <CardHeader className="p-3 pb-2 sm:p-5 sm:pb-3">
        <CardTitle>{draft.splitMode === "equal" ? "Bill subtotal" : "Items"}</CardTitle>
        <CardDescription>
          {draft.splitMode === "equal"
            ? "Enter the subtotal before tax and tip."
            : "Add items and assign shares."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0 sm:space-y-4 sm:p-5 sm:pt-0">
        {draft.splitMode === "equal" ? (
          <div className="space-y-2.5 rounded-lg border border-dashed border-border p-2.5 sm:space-y-3 sm:p-3">
            <div className="space-y-2">
              <Label htmlFor="bill-subtotal">Subtotal before tax and tip</Label>
              <MoneyInput
                className="h-9"
                id="bill-subtotal"
                placeholder="0.00"
                value={billSubtotalInput}
                onValueChange={({ displayValue }) => handleBillSubtotalChange(displayValue)}
                onFocus={() => setIsBillSubtotalFocused(true)}
                onBlur={() => {
                  setIsBillSubtotalFocused(false);
                  setBillSubtotalInput(formatMoneyInput(draft.billSubtotalCents, { emptyWhenZero: true }));
                  setError(null);
                  setBillSubtotalIssue();
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Everyone, including payer, splits evenly.
            </div>
          </div>
        ) : null}

        {draft.splitMode === "equal" && error ? (
          <Alert variant="destructive">
            <AlertTitle>Bill subtotal issue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {draft.splitMode === "equal" ? null : draft.participants.length === 0 ? (
          <Alert>
            <AlertTitle>Add participants first</AlertTitle>
            <AlertDescription>Add participants before items.</AlertDescription>
          </Alert>
        ) : (
          <form className="space-y-2.5 rounded-lg border border-dashed border-border p-2.5 sm:space-y-3 sm:p-3" onSubmit={handleAddItem}>
            <div className="grid gap-2.5 sm:gap-3 md:grid-cols-[1.2fr_180px]">
              <div className="space-y-2">
                <Label htmlFor="new-item-name">Item name</Label>
                <Input
                  className="h-9"
                  id="new-item-name"
                  value={newItem.name}
                  onChange={(event) => {
                    setNewItem((current) => ({ ...current, name: event.target.value }));
                    setError(null);
                  }}
                  placeholder="Burrito bowl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-item-amount">Amount</Label>
                <MoneyInput
                  className="h-9"
                  id="new-item-amount"
                  value={newItem.amount}
                  onValueChange={({ displayValue }) => {
                    setNewItem((current) => ({ ...current, amount: displayValue }));
                    setError(null);
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assign to</Label>
              <div className="rounded-md border border-border bg-card p-2 sm:p-2.5">
                <ParticipantAssignmentChips
                  participants={draft.participants}
                  selectedParticipantIds={newItem.participantIds}
                  onSelectedParticipantIdsChange={handleParticipantAssignmentChange}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add item
              </Button>
              <ReceiptScanner
                participants={draft.participants}
                hasExistingReceiptData={
                  draft.items.length > 0 || draft.taxCents > 0 || draft.tipCents > 0
                }
                onImport={importReceipt}
              />
            </div>
          </form>
        )}

        {draft.splitMode === "itemized" && error ? (
          <Alert variant="destructive">
            <AlertTitle>Item issue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {draft.splitMode === "equal" ? null : draft.items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-3 text-sm text-muted-foreground sm:p-4">
            No items yet. Add one to start.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">Saved items</h3>
              <span className="text-xs text-muted-foreground">{draft.items.length} total</span>
            </div>
            {draft.items.map((item, index) => (
              <ExistingItemEditor
                key={item.id}
                item={item}
                itemNumber={index + 1}
                participants={draft.participants}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
