import type {
  ParsedReceipt,
  ParsedReceiptItem,
} from "@/features/receipt-scanning/types";

const priceAtEndPattern = /(?:^|\s)\$?(-?\d{1,5}(?:,\d{3})*\.\d{2})\s*$/;
const priceOnlyPattern = /^\$?(-?\d{1,5}(?:,\d{3})*\.\d{2})$/;
const summaryPatterns = {
  subtotal: /\bsub\s*total\b/i,
  tax: /\b(?:sales\s+)?tax\b/i,
  tip: /\b(?:tip|gratuity)\b/i,
  total: /\b(?:grand\s+total|amount\s+due|total)\b/i,
};
const paymentMetadataPattern =
  /\b(?:visa|mastercard|master\s*card|amex|discover|credit|debit|cash|change|auth|approval|card|ending|tender)\b/i;
const receiptMetadataPattern =
  /\b(?:receipt|server|table|guest|check|order|date|time|phone|address|thank\s+you)\b/i;

function normalizeLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

function parsePrice(value: string) {
  const normalized = value.replaceAll(",", "");
  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount * 100);
}

function getLinePrice(line: string) {
  const match = line.match(priceAtEndPattern);
  return match ? parsePrice(match[1]) : null;
}

function getSummaryKind(line: string): keyof typeof summaryPatterns | null {
  if (summaryPatterns.subtotal.test(line)) {
    return "subtotal";
  }

  if (summaryPatterns.tax.test(line)) {
    return "tax";
  }

  if (summaryPatterns.tip.test(line)) {
    return "tip";
  }

  if (summaryPatterns.total.test(line)) {
    return "total";
  }

  return null;
}

function stripTrailingPrice(line: string) {
  return line.replace(priceAtEndPattern, "").trim().replace(/\s+/g, " ");
}

function stripLeadingQuantity(value: string) {
  return value.replace(/^\d+\s+/, "").trim();
}

function isPlausibleItemName(value: string) {
  return (
    value.length > 0 &&
    /[a-z]/i.test(value) &&
    !paymentMetadataPattern.test(value) &&
    !receiptMetadataPattern.test(value) &&
    getSummaryKind(value) === null
  );
}

export function parseReceiptText(text: string): ParsedReceipt {
  const lines = normalizeLines(text);
  const items: ParsedReceiptItem[] = [];
  const warnings: string[] = [];
  let subtotalCents: number | null = null;
  let taxCents: number | null = null;
  let tipCents: number | null = null;
  let totalCents: number | null = null;
  let sawNegativeAmount = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const amountCents = getLinePrice(line);

    if (amountCents !== null && amountCents < 0) {
      sawNegativeAmount = true;
      continue;
    }

    const summaryKind = getSummaryKind(line);
    if (summaryKind && amountCents !== null) {
      if (summaryKind === "subtotal") {
        subtotalCents = amountCents;
      } else if (summaryKind === "tax") {
        taxCents = amountCents;
      } else if (summaryKind === "tip") {
        tipCents = amountCents;
      } else {
        totalCents = amountCents;
      }
      continue;
    }

    if (amountCents !== null && amountCents > 0) {
      const name = stripLeadingQuantity(stripTrailingPrice(line));

      if (isPlausibleItemName(name)) {
        items.push({
          name,
          amountCents,
          sourceLine: line,
        });
      }
      continue;
    }

    const nextLine = lines[index + 1];
    const nextPriceMatch = nextLine?.match(priceOnlyPattern);
    const name = stripLeadingQuantity(line);

    if (nextPriceMatch && isPlausibleItemName(name)) {
      const nextAmountCents = parsePrice(nextPriceMatch[1]);

      if (nextAmountCents !== null && nextAmountCents > 0) {
        items.push({
          name,
          amountCents: nextAmountCents,
          sourceLine: `${line} ${nextLine}`,
        });
        index += 1;
      } else if (nextAmountCents !== null && nextAmountCents < 0) {
        sawNegativeAmount = true;
      }
    }
  }

  if (sawNegativeAmount) {
    warnings.push("Discounts or negative amounts require manual review.");
  }

  const itemSubtotalCents = items.reduce((sum, item) => sum + item.amountCents, 0);

  if (subtotalCents !== null && items.length > 0 && itemSubtotalCents !== subtotalCents) {
    warnings.push("Detected items do not match the receipt subtotal.");
  }

  if (totalCents !== null && items.length > 0) {
    const detectedTotalCents =
      itemSubtotalCents + (taxCents ?? 0) + (tipCents ?? 0);

    if (detectedTotalCents !== totalCents) {
      warnings.push("Detected amounts do not match the receipt total.");
    }
  }

  return {
    items,
    subtotalCents,
    taxCents,
    tipCents,
    totalCents,
    warnings,
  };
}

export function isReceiptTextRecognizable(text: string) {
  if (text.replace(/\s/g, "").length < 20) {
    return false;
  }

  const parsed = parseReceiptText(text);

  return (
    parsed.items.length > 0 ||
    parsed.subtotalCents !== null ||
    parsed.taxCents !== null ||
    parsed.tipCents !== null ||
    parsed.totalCents !== null
  );
}
