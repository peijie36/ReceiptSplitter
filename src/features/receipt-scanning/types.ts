export type OcrProgress = {
  status: string;
  progress: number | null;
};

export type OcrTextResult = {
  text: string;
  confidence: number | null;
};

export type ParsedReceiptItem = {
  name: string;
  amountCents: number;
  sourceLine: string;
};

export type ParsedReceipt = {
  items: ParsedReceiptItem[];
  subtotalCents: number | null;
  taxCents: number | null;
  tipCents: number | null;
  totalCents: number | null;
  warnings: string[];
};

export type ReceiptImportInput = {
  items: Array<{
    name: string;
    amountCents: number;
    participantIds: string[];
  }>;
  taxCents: number;
  tipCents: number;
  strategy: "replace" | "append";
};
