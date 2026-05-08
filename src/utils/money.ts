const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});

type MoneyInputOptions = {
  emptyWhenZero?: boolean;
};

const moneyDisplayCleanupPattern = /[$,\s]/g;

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

  const normalized = trimmed.replace(moneyDisplayCleanupPattern, "");

  if (normalized.length === 0) {
    return { cents: 0 };
  }

  if (!/^\d*\.?\d*$/.test(normalized)) {
    return { cents: null, error: "Enter only numbers and a decimal point." };
  }

  const [dollarText = "", centText = ""] = normalized.split(".");

  if (centText.length > 2) {
    return { cents: null, error: "Use at most two decimal places." };
  }

  const dollars = dollarText.length > 0 ? Number.parseInt(dollarText, 10) : 0;
  const centsPart = centText.length > 0 ? Number.parseInt(centText.padEnd(2, "0"), 10) : 0;
  const cents = dollars * 100 + centsPart;

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

  const displayValue = value.trim().replace(moneyDisplayCleanupPattern, "");

  return {
    displayValue: displayValue.length === 0 && options.emptyWhenZero ? "" : displayValue,
    cents: parsed.cents,
  };
}
