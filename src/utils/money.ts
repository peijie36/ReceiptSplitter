const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});

type MoneyInputOptions = {
  emptyWhenZero?: boolean;
};

export function formatCurrency(cents: number) {
  return currencyFormatter.format(cents / 100);
}

export function formatMoneyInput(cents: number, options: MoneyInputOptions = {}) {
  if (options.emptyWhenZero && cents === 0) {
    return "";
  }

  return (cents / 100).toFixed(2);
}

export function parseMoneyInput(value: string): { cents: number | null; error?: string } {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { cents: 0 };
  }

  if (trimmed.includes("-")) {
    return { cents: null, error: "Amount cannot be negative." };
  }

  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 0) {
    return { cents: 0 };
  }

  const cents = Number.parseInt(digits, 10);

  if (!Number.isSafeInteger(cents)) {
    return { cents: null, error: "Amount is too large." };
  }

  return { cents };
}

export function normalizeMoneyInput(
  value: string,
  options: MoneyInputOptions = {},
): { displayValue: string; cents: number | null; error?: string } {
  const parsed = parseMoneyInput(value);

  if (parsed.cents === null) {
    return {
      displayValue: value,
      cents: null,
      error: parsed.error,
    };
  }

  return {
    displayValue: formatMoneyInput(parsed.cents, options),
    cents: parsed.cents,
  };
}
