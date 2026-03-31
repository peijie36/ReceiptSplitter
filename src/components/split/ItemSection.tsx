import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { useAppStore } from "@/store/useAppStore";
import type { Item, Participant } from "@/types/split";
import { formatCurrency, formatMoneyInput, normalizeMoneyInput, parseMoneyInput } from "@/utils/money";

type ItemFormState = {
  name: string;
  amount: string;
  participantIds: string[];
};

function toggleParticipantSelection(state: ItemFormState, participantId: string) {
  const isSelected = state.participantIds.includes(participantId);

  if (isSelected && state.participantIds.length === 1) {
    return {
      nextState: state,
      error: "Every item must stay assigned to at least one participant.",
    };
  }

  return {
    nextState: {
      ...state,
      participantIds: isSelected
        ? state.participantIds.filter((assignedId) => assignedId !== participantId)
        : [...state.participantIds, participantId],
    },
  };
}

function buildFormState(item?: Item): ItemFormState {
  return {
    name: item?.name ?? "",
    amount: item ? formatMoneyInput(item.amountCents) : "",
    participantIds: item?.participantIds ?? [],
  };
}

type ExistingItemEditorProps = {
  item: Item;
  participants: Participant[];
};

function ExistingItemEditor({ item, participants }: ExistingItemEditorProps) {
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

  function handleSave() {
    commitChanges();
  }

  function handleCommitOnEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    event.currentTarget.blur();
  }

  return (
    <div className="rounded-xl border border-border/80 bg-background/70 p-4">
      <div className="grid gap-3 lg:grid-cols-[1.2fr_180px_1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor={`item-name-${item.id}`}>Item</Label>
          <Input
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
        <div className="space-y-2">
          <Label>Assigned to</Label>
          <div className="grid gap-2 rounded-lg border border-border bg-card p-3">
            {participants.map((participant) => (
              <label key={participant.id} className="inline-flex items-center gap-2 text-sm">
                <Checkbox
                  checked={state.participantIds.includes(participant.id)}
                  onCheckedChange={() => {
                    const { nextState, error: toggleError } = toggleParticipantSelection(state, participant.id);
                    setState(nextState);

                    if (toggleError) {
                      setError(toggleError);
                      return;
                    }

                    commitChanges(nextState);
                  }}
                />
                <span>{participant.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-end justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleSave}>
            <Pencil className="h-4 w-4" />
            Update
          </Button>
          <Button type="button" variant="ghost" onClick={() => removeItem(item.id)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      <div className="mt-3 text-sm text-muted-foreground">Current amount: {formatCurrency(item.amountCents)}</div>
      {error ? (
        <Alert className="mt-3" variant="destructive">
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBillSubtotalInput(formatMoneyInput(draft.billSubtotalCents, { emptyWhenZero: true }));
  }, [draft.billSubtotalCents]);

  function handleParticipantToggle(participantId: string) {
    const isSelected = newItem.participantIds.includes(participantId);
    const participantIds = isSelected
      ? newItem.participantIds.filter((assignedId) => assignedId !== participantId)
      : [...newItem.participantIds, participantId];

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
      <CardHeader>
        <CardTitle>{draft.splitMode === "equal" ? "Bill subtotal" : "Items"}</CardTitle>
        <CardDescription>
          {draft.splitMode === "equal"
            ? "Enter the pre-tax, pre-tip subtotal. In equal mode, subtotal, tax, and tip are all split evenly."
            : "Enter each line item and choose who shares it."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {draft.splitMode === "equal" ? (
          <div className="space-y-4 rounded-xl border border-dashed border-border p-4">
            <div className="space-y-2">
              <Label htmlFor="bill-subtotal">Subtotal before tax and tip</Label>
              <MoneyInput
                id="bill-subtotal"
                placeholder="0.00"
                value={billSubtotalInput}
                onValueChange={({ displayValue }) => handleBillSubtotalChange(displayValue)}
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
          <form className="space-y-4 rounded-xl border border-dashed border-border p-4" onSubmit={handleAddItem}>
            <div className="grid gap-3 md:grid-cols-[1.2fr_180px]">
              <div className="space-y-2">
                <Label htmlFor="new-item-name">Item name</Label>
                <Input
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
              <div className="grid gap-2 rounded-lg border border-border bg-card p-3 sm:grid-cols-2">
                {draft.participants.map((participant) => (
                  <label key={participant.id} className="inline-flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={newItem.participantIds.includes(participant.id)}
                      onCheckedChange={() => handleParticipantToggle(participant.id)}
                    />
                    <span>{participant.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit">
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
          <div className="rounded-xl border border-dashed border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
            No items yet. Add each bill item and assign it to one or more participants.
          </div>
        ) : (
          <div className="space-y-3">
            {draft.items.map((item) => (
              <ExistingItemEditor key={item.id} item={item} participants={draft.participants} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
