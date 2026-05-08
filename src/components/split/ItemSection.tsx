import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { ParticipantAssignmentChips } from "@/components/split/ParticipantAssignmentChips";
import { useAppStore } from "@/store/useAppStore";
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
  const updateItem = useAppStore((state) => state.updateItem);
  const removeItem = useAppStore((state) => state.removeItem);

  const [state, setState] = useState<ItemFormState>(buildFormState(item));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setState(buildFormState(item));
  }, [item]);

  function commitChanges(nextState: ItemFormState = state) {
    const parsed = parseMoneyInput(nextState.amount);

    if (parsed.cents === null) {
      setError(parsed.error ?? "Enter a valid item amount.");
      return false;
    }

    const result = updateItem(item.id, {
      name: nextState.name,
      amountCents: parsed.cents,
      participantIds: nextState.participantIds,
    });

    if (!result.ok) {
      setError(result.error ?? "Unable to update item.");
      return false;
    }

    setError(null);
    return true;
  }

  function handleAssignmentChange(participantIds: string[]) {
    const nextState = {
      ...state,
      participantIds,
    };

    setState(nextState);

    if (participantIds.length === 0) {
      setError("Assign this item to at least one participant before updating.");
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

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-border/80 bg-background/70">
      <div className="flex min-w-0 items-end justify-between gap-3 border-b border-border/70 bg-secondary/30 px-3 py-2">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase text-muted-foreground">Item {itemNumber}</div>
          <div className="truncate font-medium">{headerName}</div>
        </div>
        <div className="shrink-0 font-semibold tabular-nums">
          {headerAmount === null ? formatCurrency(item.amountCents) : formatCurrency(headerAmount)}
        </div>
      </div>
      <div className="grid min-w-0 gap-2 p-3 md:grid-cols-[minmax(0,1fr)_9rem]">
        <div className="space-y-2">
          <Label htmlFor={`item-name-${item.id}`}>Item</Label>
          <Input
            className="h-9"
            id={`item-name-${item.id}`}
            value={state.name}
            onChange={(event) => {
              setState((current) => ({ ...current, name: event.target.value }));
              setError(null);
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
            }}
            onBlur={() => {
              commitChanges();
            }}
            onKeyDown={handleCommitOnEnter}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label>Assigned to</Label>
          <div className="rounded-md border border-border bg-card p-2.5">
            <ParticipantAssignmentChips
              participants={participants}
              selectedParticipantIds={state.participantIds}
              onSelectedParticipantIdsChange={handleAssignmentChange}
            />
          </div>
        </div>
        <div className="flex items-end justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="w-full">
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
  const draft = useAppStore((state) => state.draft);
  const addItem = useAppStore((state) => state.addItem);
  const setBillSubtotalCents = useAppStore((state) => state.setBillSubtotalCents);

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
      setError(normalized.error ?? "Enter a valid subtotal.");
      return;
    }

    const result = setBillSubtotalCents(normalized.cents);

    if (!result.ok) {
      setError(result.error ?? "Unable to set subtotal.");
      return;
    }

    setError(null);
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
        <CardTitle>{draft.splitMode === "equal" ? "Bill subtotal" : "Items"}</CardTitle>
        <CardDescription>
          {draft.splitMode === "equal"
            ? "Enter the pre-tax, pre-tip subtotal. In equal mode, subtotal, tax, and tip are all split evenly."
            : "Enter each line item and choose who shares it."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
        {draft.splitMode === "equal" ? (
          <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
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
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              The full bill will be divided equally across every participant, including the payer.
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
            <AlertDescription>You need participants before you can assign bill items.</AlertDescription>
          </Alert>
        ) : (
          <form className="space-y-3 rounded-lg border border-dashed border-border p-3" onSubmit={handleAddItem}>
            <div className="grid gap-3 md:grid-cols-[1.2fr_180px]">
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
              <div className="rounded-md border border-border bg-card p-2.5">
                <ParticipantAssignmentChips
                  participants={draft.participants}
                  selectedParticipantIds={newItem.participantIds}
                  onSelectedParticipantIdsChange={handleParticipantAssignmentChange}
                />
              </div>
            </div>

            <Button type="submit" size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </form>
        )}

        {draft.splitMode === "itemized" && error ? (
          <Alert variant="destructive">
            <AlertTitle>Item issue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {draft.splitMode === "equal" ? null : draft.items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            No items yet. Add each bill item and assign it to one or more participants.
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
