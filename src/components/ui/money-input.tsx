import * as React from "react";

import { Input, type InputProps } from "@/components/ui/input";
import { normalizeMoneyInput } from "@/utils/money";

type MoneyInputChange = {
  displayValue: string;
  cents: number | null;
  error?: string;
};

export interface MoneyInputProps extends Omit<InputProps, "inputMode" | "onChange" | "type" | "value"> {
  value: string;
  emptyWhenZero?: boolean;
  onValueChange: (change: MoneyInputChange) => void;
}

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ emptyWhenZero = true, onValueChange, value, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onValueChange(normalizeMoneyInput(event.target.value, { emptyWhenZero }))}
        {...props}
      />
    );
  },
);

MoneyInput.displayName = "MoneyInput";

export { MoneyInput };
