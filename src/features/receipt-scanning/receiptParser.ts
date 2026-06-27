import type {
  ParsedReceipt,
  ParsedReceiptItem,
} from "@/features/receipt-scanning/types";

const priceAtEndPattern =
  /(?:^|\s)\$?(-?\d{1,5}(?:,\d{3})*(?:[.,]\d{2}))(?:\s+[a-z]{1,3})?\s*$/i;
const priceOnlyPattern =
  /^\$?(-?\d{1,5}(?:,\d{3})*(?:[.,]\d{2}))(?:\s+[a-z]{1,3})?$/i;
const summaryPatterns = {
  subtotal: /\bsub\s*total\b/i,
  tax: /\b(?:sales\s+)?tax(?:es)?\b/i,
  tip: /\b(?:tip|gratuity)\b/i,
  total: /\b(?:grand\s+total|amount\s+due|balance\s+due|total)\b/i,
};
const paymentMetadataPattern =
  /\b(?:visa|mastercard|master\s*card|amex|discover|credit|debit|cash|change|auth|approval|card|ending|tender)\b/i;
const receiptMetadataPattern =
  /\b(?:receipt|server|table|guest|check|order|date|time|phone|address|thank\s+you)\b/i;
const serviceChargePattern =
  /\b(?:service\s+charge|service\s+fee|convenience\s+fee|processing\s+fee|delivery\s+fee|admin\s+fee|credit\s+card\s+fee|surcharge)\b/i;
const discountPattern =
  /\b(?:cash\s+discount|coupon|discount|promo|promotion|reward)\b/i;
const modifierPattern =
  /^(?:add|custom|dressing|extra|hold|mod|modifier|no|note|notes|sauce|side|sub|substitute|with|without)\b/i;
const suggestedTipPattern =
  /\b(?:suggested|suggestion|recommended|recommendation)\b.*\b(?:tip|gratuity)\b|\b(?:tip|gratuity)\b.*\b(?:suggested|suggestion|recommended|recommendation)\b/i;
const itemHeaderPattern =
  /\b(?:item|description|qty|quantity|price|amount)\b/i;

function normalizeLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

function parsePrice(value: string) {
  const normalized = value.includes(".")
    ? value.replaceAll(",", "")
    : value.replace(",", ".");
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

  if (summaryPatterns.total.test(line)) {
    return "total";
  }

  if (summaryPatterns.tip.test(line)) {
    return "tip";
  }

  return null;
}

function stripTrailingPrice(line: string) {
  return line.replace(priceAtEndPattern, "").trim().replace(/\s+/g, " ");
}

function stripItemQuantityMarkers(value: string) {
  return value
    .replace(/^\d+\s+/, "")
    .replace(/\s+\d+$/, "")
    .trim();
}

function isPlausibleItemName(value: string) {
  return (
    value.length > 0 &&
    /[a-z]/i.test(value) &&
    !paymentMetadataPattern.test(value) &&
    !receiptMetadataPattern.test(value) &&
    !serviceChargePattern.test(value) &&
    !discountPattern.test(value) &&
    !modifierPattern.test(value) &&
    getSummaryKind(value) === null
  );
}

function isItemHeader(line: string) {
  if (getSummaryKind(line)) {
    return false;
  }

  if (/\b(?:item|description)\b/i.test(line)) {
    return itemHeaderPattern.test(line);
  }

  return /\b(?:qty|quantity)\b/i.test(line) && /\b(?:price|amount)\b/i.test(line);
}

function isItemSectionEnd(line: string) {
  return (
    getSummaryKind(line) !== null ||
    suggestedTipPattern.test(line) ||
    (paymentMetadataPattern.test(line) && getLinePrice(line) !== null)
  );
}

function getItemSectionRange(lines: string[]) {
  const headerIndex = lines.findIndex(isItemHeader);
  const startIndex = headerIndex === -1 ? 0 : headerIndex + 1;
  const endIndex = lines.findIndex(
    (line, index) => index >= startIndex && isItemSectionEnd(line),
  );

  return {
    startIndex,
    endIndex: endIndex === -1 ? lines.length : endIndex,
    hasHeader: headerIndex !== -1,
  };
}

function getAdjacentItemCandidate(lines: string[], index: number) {
  const line = lines[index];
  const name = stripItemQuantityMarkers(line);

  if (!modifierPattern.test(name)) {
    return {
      name,
      sourceLineStart: line,
    };
  }

  for (let previousIndex = index - 1; previousIndex >= 0; previousIndex -= 1) {
    const previousLine = lines[previousIndex];

    if (getLinePrice(previousLine) !== null || getSummaryKind(previousLine)) {
      break;
    }

    const previousName = stripItemQuantityMarkers(previousLine);

    if (modifierPattern.test(previousName)) {
      continue;
    }

    return {
      name: previousName,
      sourceLineStart: `${previousLine} ${line}`,
    };
  }

  return {
    name,
    sourceLineStart: line,
  };
}

function hasModifierThenPrice(lines: string[], index: number) {
  const nextLine = lines[index + 1];
  const followingLine = lines[index + 2];

  return (
    nextLine !== undefined &&
    followingLine !== undefined &&
    modifierPattern.test(stripItemQuantityMarkers(nextLine)) &&
    priceOnlyPattern.test(followingLine)
  );
}

function isLikelyUnmatchedItemRow(lines: string[], index: number) {
  const line = lines[index];

  return (
    getLinePrice(line) === null &&
    !hasModifierThenPrice(lines, index) &&
    isPlausibleItemName(stripItemQuantityMarkers(line))
  );
}

export function parseReceiptText(text: string): ParsedReceipt {
  const lines = normalizeLines(text);
  const itemSection = getItemSectionRange(lines);
  const items: ParsedReceiptItem[] = [];
  const warnings: string[] = [];
  let subtotalCents: number | null = null;
  let taxCents: number | null = null;
  let tipCents: number | null = null;
  let totalCents: number | null = null;
  let sawNegativeAmount = false;
  let sawServiceCharge = false;
  let sawUnmatchedItemRow = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const amountCents = getLinePrice(line);
    const isInItemSection =
      index >= itemSection.startIndex && index < itemSection.endIndex;

    if (amountCents !== null && amountCents < 0) {
      sawNegativeAmount = true;
      continue;
    }

    if (amountCents !== null && serviceChargePattern.test(line)) {
      sawServiceCharge = true;
      continue;
    }

    if (amountCents !== null && discountPattern.test(line)) {
      sawNegativeAmount = true;
      continue;
    }

    if (amountCents !== null && suggestedTipPattern.test(line)) {
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

    if (!isInItemSection) {
      continue;
    }

    if (amountCents !== null && amountCents > 0) {
      const name = stripItemQuantityMarkers(stripTrailingPrice(line));

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
    const itemCandidate = getAdjacentItemCandidate(lines, index);
    const name = itemCandidate.name;

    if (nextPriceMatch && isPlausibleItemName(name)) {
      const nextAmountCents = parsePrice(nextPriceMatch[1]);

      if (nextAmountCents !== null && nextAmountCents > 0) {
        items.push({
          name,
          amountCents: nextAmountCents,
          sourceLine: `${itemCandidate.sourceLineStart} ${nextLine}`,
        });
        index += 1;
      } else if (nextAmountCents !== null && nextAmountCents < 0) {
        sawNegativeAmount = true;
      }
    } else if (itemSection.hasHeader && isLikelyUnmatchedItemRow(lines, index)) {
      sawUnmatchedItemRow = true;
    }
  }

  if (sawNegativeAmount) {
    warnings.push("Discounts or negative amounts require manual review.");
  }

  if (sawServiceCharge) {
    warnings.push("Service charges or fees require manual review.");
  }

  if (sawUnmatchedItemRow) {
    warnings.push("Some item rows could not be matched with prices.");
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
