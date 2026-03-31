import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/useAppStore";
import type { AllocationMode } from "@/types/split";
import { formatMoneyInput } from "@/utils/money";

function AllocationModeField({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: AllocationMode;
  onValueChange: (value: AllocationMode) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue as AllocationMode)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="proportional">Proportional to item subtotal</SelectItem>
          <SelectItem value="equal">Equal across all participants</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function ChargeSection() {
  const draft = useAppStore((state) => state.draft);
  const setTaxCents = useAppStore((state) => state.setTaxCents);
  const setTipCents = useAppStore((state) => state.setTipCents);
  const setTaxAllocationMode = useAppStore((state) => state.setTaxAllocationMode);
  const setTipAllocationMode = useAppStore((state) => state.setTipAllocationMode);

  const [taxInput, setTaxInput] = useState(formatMoneyInput(draft.taxCents, { emptyWhenZero: true }));
  const [tipInput, setTipInput] = useState(formatMoneyInput(draft.tipCents, { emptyWhenZero: true }));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTaxInput(formatMoneyInput(draft.taxCents, { emptyWhenZero: true }));
  }, [draft.taxCents]);

  useEffect(() => {
    setTipInput(formatMoneyInput(draft.tipCents, { emptyWhenZero: true }));
  }, [draft.tipCents]);

  function handleTaxChange(value: string, cents: number | null, nextError?: string) {
    setTaxInput(value);

    if (cents === null) {
      setError(nextError ?? "Enter a valid tax amount.");
      return;
    }

    const result = setTaxCents(cents);

    if (!result.ok) {
      setError(result.error ?? "Unable to set tax.");
      return;
    }

    setError(null);
  }

  function handleTipChange(value: string, cents: number | null, nextError?: string) {
    setTipInput(value);

    if (cents === null) {
      setError(nextError ?? "Enter a valid tip amount.");
      return;
    }

    const result = setTipCents(cents);

    if (!result.ok) {
      setError(result.error ?? "Unable to set tip.");
      return;
    }

    setError(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax and tip</CardTitle>
        <CardDescription>
          {draft.splitMode === "equal"
            ? "Equal bill mode splits tax and tip evenly across all participants."
            : "Allocate extra charges independently as equal or proportional shares."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tax-input">Tax</Label>
            <MoneyInput
              id="tax-input"
              placeholder="0.00"
              value={taxInput}
              onValueChange={({ displayValue, cents, error: nextError }) =>
                handleTaxChange(displayValue, cents, nextError)
              }
            />
          </div>
          {draft.splitMode === "equal" ? (
            <div className="space-y-2">
              <Label>Tax allocation</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-secondary/40 px-3 text-sm text-muted-foreground">
                Forced to equal in this mode
              </div>
            </div>
          ) : (
            <AllocationModeField
              label="Tax allocation"
              value={draft.taxAllocationMode}
              onValueChange={setTaxAllocationMode}
            />
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tip-input">Tip</Label>
            <MoneyInput
              id="tip-input"
              placeholder="0.00"
              value={tipInput}
              onValueChange={({ displayValue, cents, error: nextError }) =>
                handleTipChange(displayValue, cents, nextError)
              }
            />
          </div>
          {draft.splitMode === "equal" ? (
            <div className="space-y-2">
              <Label>Tip allocation</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-secondary/40 px-3 text-sm text-muted-foreground">
                Forced to equal in this mode
              </div>
            </div>
          ) : (
            <AllocationModeField
              label="Tip allocation"
              value={draft.tipAllocationMode}
              onValueChange={setTipAllocationMode}
            />
          )}
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Charge issue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
