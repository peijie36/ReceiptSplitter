import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { ParticipantAssignmentChips } from "@/components/split/ParticipantAssignmentChips";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import type { ActionResult, Participant } from "@/types/split";
import type {
  ParsedReceipt,
  ReceiptImportInput,
} from "@/features/receipt-scanning/types";
import { formatMoneyInput, parseMoneyInput } from "@/utils/money";

type ReviewItem = {
  id: string;
  name: string;
  amount: string;
  participantIds: string[];
};

type ReviewState = {
  items: ReviewItem[];
  subtotal: string;
  tax: string;
  tip: string;
  total: string;
  warnings: string[];
};

type ReceiptReviewFormProps = {
  receipt: ParsedReceipt;
  participants: Participant[];
  hasExistingReceiptData: boolean;
  onImport: (input: ReceiptImportInput) => ActionResult;
  onCancel: () => void;
  onImported: () => void;
};

function createReviewState(receipt: ParsedReceipt): ReviewState {
  return {
    items: receipt.items.map((item, index) => ({
      id: `${index}-${item.sourceLine}`,
      name: item.name,
      amount: formatMoneyInput(item.amountCents),
      participantIds: [],
    })),
    subtotal:
      receipt.subtotalCents === null ? "" : formatMoneyInput(receipt.subtotalCents),
    tax: formatMoneyInput(receipt.taxCents ?? 0),
    tip: formatMoneyInput(receipt.tipCents ?? 0),
    total: receipt.totalCents === null ? "" : formatMoneyInput(receipt.totalCents),
    warnings: receipt.warnings,
  };
}

function parseOptionalMoney(value: string) {
  return value.trim().length === 0 ? null : parseMoneyInput(value).cents;
}

export function ReceiptReviewForm({
  receipt,
  participants,
  hasExistingReceiptData,
  onImport,
  onCancel,
  onImported,
}: ReceiptReviewFormProps) {
  const [review, setReview] = useState(() => createReviewState(receipt));
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmingImport, setConfirmingImport] = useState(false);

  const parsedItems = useMemo(
    () =>
      review.items.map((item) => ({
        name: item.name.trim(),
        amountCents: parseMoneyInput(item.amount).cents,
        participantIds: item.participantIds,
      })),
    [review.items],
  );
  const reviewIsValid =
    parsedItems.length > 0 &&
    parsedItems.every(
      (item) =>
        item.name.length > 0 &&
        item.amountCents !== null &&
        item.amountCents > 0 &&
        item.participantIds.length > 0,
    ) &&
    parseMoneyInput(review.tax).cents !== null &&
    parseMoneyInput(review.tip).cents !== null;

  const reconciliationWarnings = useMemo(() => {
    const warnings = new Set(review.warnings);
    const itemSubtotal = parsedItems.reduce(
      (sum, item) => sum + (item.amountCents ?? 0),
      0,
    );
    const subtotal = parseOptionalMoney(review.subtotal);
    const tax = parseMoneyInput(review.tax).cents;
    const tip = parseMoneyInput(review.tip).cents;
    const total = parseOptionalMoney(review.total);

    if (subtotal !== null && itemSubtotal !== subtotal) {
      warnings.add("Detected items do not match the receipt subtotal.");
    }

    if (
      total !== null &&
      tax !== null &&
      tip !== null &&
      itemSubtotal + tax + tip !== total
    ) {
      warnings.add("Detected amounts do not match the receipt total.");
    }

    return [...warnings];
  }, [parsedItems, review]);

  function importWithStrategy(strategy: ReceiptImportInput["strategy"]) {
    if (!reviewIsValid) {
      return;
    }

    const taxCents = parseMoneyInput(review.tax).cents;
    const tipCents = parseMoneyInput(review.tip).cents;
    if (taxCents === null || tipCents === null) {
      return;
    }

    const result = onImport({
      items: parsedItems.map((item) => ({
        name: item.name,
        amountCents: item.amountCents ?? 0,
        participantIds: item.participantIds,
      })),
      taxCents,
      tipCents,
      strategy,
    });

    if (!result.ok) {
      setImportError(result.error ?? "Unable to import this receipt.");
      return;
    }

    setConfirmingImport(false);
    onImported();
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-medium">Review items</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setReview((current) => ({
                  ...current,
                  items: [
                    ...current.items,
                    {
                      id: crypto.randomUUID(),
                      name: "",
                      amount: "",
                      participantIds: [],
                    },
                  ],
                }))
              }
            >
              <Plus className="h-4 w-4" />
              Add row
            </Button>
          </div>
          {review.items.length === 0 ? (
            <Alert>
              <AlertTitle>No item rows detected</AlertTitle>
              <AlertDescription>
                Add item rows manually or rescan a clearer image.
              </AlertDescription>
            </Alert>
          ) : null}
          {review.items.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-lg border p-3">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto]">
                <div className="space-y-2">
                  <Label htmlFor={`receipt-item-name-${item.id}`}>Item {index + 1}</Label>
                  <Input
                    id={`receipt-item-name-${item.id}`}
                    value={item.name}
                    onChange={(event) =>
                      setReview((current) => ({
                        ...current,
                        items: current.items.map((currentItem) =>
                          currentItem.id === item.id
                            ? { ...currentItem, name: event.target.value }
                            : currentItem,
                        ),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`receipt-item-amount-${item.id}`}>Price</Label>
                  <MoneyInput
                    id={`receipt-item-amount-${item.id}`}
                    value={item.amount}
                    onValueChange={({ displayValue }) =>
                      setReview((current) => ({
                        ...current,
                        items: current.items.map((currentItem) =>
                          currentItem.id === item.id
                            ? { ...currentItem, amount: displayValue }
                            : currentItem,
                        ),
                      }))
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete item ${index + 1}`}
                    onClick={() =>
                      setReview((current) => ({
                        ...current,
                        items: current.items.filter(
                          (currentItem) => currentItem.id !== item.id,
                        ),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assigned to</Label>
                <ParticipantAssignmentChips
                  participants={participants}
                  selectedParticipantIds={item.participantIds}
                  onSelectedParticipantIdsChange={(participantIds) =>
                    setReview((current) => ({
                      ...current,
                      items: current.items.map((currentItem) =>
                        currentItem.id === item.id
                          ? { ...currentItem, participantIds }
                          : currentItem,
                      ),
                    }))
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["subtotal", "Receipt subtotal"],
            ["tax", "Receipt tax"],
            ["tip", "Receipt tip"],
            ["total", "Receipt total"],
          ].map(([field, label]) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={`receipt-${field}`}>{label}</Label>
              <MoneyInput
                id={`receipt-${field}`}
                value={
                  review[
                    field as keyof Pick<
                      ReviewState,
                      "subtotal" | "tax" | "tip" | "total"
                    >
                  ]
                }
                onValueChange={({ displayValue }) =>
                  setReview((current) => ({ ...current, [field]: displayValue }))
                }
              />
            </div>
          ))}
        </div>

        {reconciliationWarnings.length > 0 ? (
          <Alert>
            <AlertTitle>Check detected totals</AlertTitle>
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-5">
                {reconciliationWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}

        {importError ? (
          <Alert variant="destructive">
            <AlertTitle>Import issue</AlertTitle>
            <AlertDescription>{importError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!reviewIsValid}
            onClick={() => {
              if (hasExistingReceiptData) {
                setConfirmingImport(true);
              } else {
                importWithStrategy("replace");
              }
            }}
          >
            Import receipt
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmingImport} onOpenChange={setConfirmingImport}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>How should this scan update the current receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              Replace removes current items and sets tax and tip. Append keeps current items and adds the scanned charges.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => importWithStrategy("replace")}>
              Replace receipt data
            </AlertDialogAction>
            <AlertDialogAction onClick={() => importWithStrategy("append")}>
              Append receipt data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
