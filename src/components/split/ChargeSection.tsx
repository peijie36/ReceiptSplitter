import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppStore } from "@/store/useAppStore";
import type { AllocationMode } from "@/types/split";
import { cn } from "@/lib/utils";
import { formatMoneyInput } from "@/utils/money";

function AllocationModeToggle({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: AllocationMode;
  onValueChange: (value: AllocationMode) => void;
}) {
  const options: Array<{ value: AllocationMode; label: string }> = [
    { value: "proportional", label: "Proportional" },
    { value: "equal", label: "Equal" },
  ];

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <RadioGroup
        aria-label={label}
        className="grid grid-cols-2 gap-1 rounded-md border border-input bg-card p-1"
        value={value}
        onValueChange={(nextValue) => onValueChange(nextValue as AllocationMode)}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex h-8 cursor-pointer items-center justify-center rounded-sm px-3 text-sm font-medium transition-colors",
              value === option.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <RadioGroupItem className="sr-only" value={option.value} />
            <span>{option.label}</span>
          </label>
        ))}
      </RadioGroup>
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
  const [focusedChargeInput, setFocusedChargeInput] = useState<"tax" | "tip" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (focusedChargeInput === "tax") {
      return;
    }

    setTaxInput(formatMoneyInput(draft.taxCents, { emptyWhenZero: true }));
  }, [draft.taxCents, focusedChargeInput]);

  useEffect(() => {
    if (focusedChargeInput === "tip") {
      return;
    }

    setTipInput(formatMoneyInput(draft.tipCents, { emptyWhenZero: true }));
  }, [draft.tipCents, focusedChargeInput]);

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
      <CardHeader className="p-3 pb-2 sm:p-5 sm:pb-3">
        <CardTitle>Tax and tip</CardTitle>
        <CardDescription>
          {draft.splitMode === "equal"
            ? "Equal bill mode splits tax and tip evenly across all participants."
            : "Allocate extra charges independently as equal or proportional shares."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0 sm:space-y-4 sm:p-5 sm:pt-0">
        <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tax-input">Tax</Label>
            <MoneyInput
              className="h-9"
              id="tax-input"
              placeholder="0.00"
              value={taxInput}
              onValueChange={({ displayValue, cents, error: nextError }) =>
                handleTaxChange(displayValue, cents, nextError)
              }
              onFocus={() => setFocusedChargeInput("tax")}
              onBlur={() => {
                setFocusedChargeInput(null);
                setTaxInput(formatMoneyInput(draft.taxCents, { emptyWhenZero: true }));
              }}
            />
          </div>
          {draft.splitMode === "equal" ? (
            <div className="space-y-2">
              <Label>Tax allocation</Label>
              <div className="flex h-9 items-center rounded-md border border-input bg-secondary/40 px-3 text-sm text-muted-foreground">
                Forced to equal in this mode
              </div>
            </div>
          ) : (
            <AllocationModeToggle
              label="Tax allocation"
              value={draft.taxAllocationMode}
              onValueChange={setTaxAllocationMode}
            />
          )}
        </div>

        <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tip-input">Tip</Label>
            <MoneyInput
              className="h-9"
              id="tip-input"
              placeholder="0.00"
              value={tipInput}
              onValueChange={({ displayValue, cents, error: nextError }) =>
                handleTipChange(displayValue, cents, nextError)
              }
              onFocus={() => setFocusedChargeInput("tip")}
              onBlur={() => {
                setFocusedChargeInput(null);
                setTipInput(formatMoneyInput(draft.tipCents, { emptyWhenZero: true }));
              }}
            />
          </div>
          {draft.splitMode === "equal" ? (
            <div className="space-y-2">
              <Label>Tip allocation</Label>
              <div className="flex h-9 items-center rounded-md border border-input bg-secondary/40 px-3 text-sm text-muted-foreground">
                Forced to equal in this mode
              </div>
            </div>
          ) : (
            <AllocationModeToggle
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
