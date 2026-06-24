import {
  preprocessReceiptImage,
  validateReceiptImage,
} from "@/features/receipt-scanning/adapters/browserReceiptImage";
import { recognizeReceipt } from "@/features/receipt-scanning/adapters/tesseractReceiptOcr";
import {
  isReceiptTextRecognizable,
  parseReceiptText,
} from "@/features/receipt-scanning/receiptParser";
import type {
  OcrProgress,
  OcrTextResult,
  ParsedReceipt,
} from "@/features/receipt-scanning/types";

const OCR_RUNTIME_ERROR =
  "Receipt scanning could not start. Check your connection and try again, or enter the receipt manually.";
const IMAGE_DECODE_ERROR = "This image could not be opened. Try a different file.";
const UNREADABLE_RECEIPT_ERROR =
  "We couldn't read this receipt. Try a sharper, well-lit image with the full receipt visible, or enter it manually.";

type ReceiptScanDependencies = {
  validate: typeof validateReceiptImage;
  preprocess: typeof preprocessReceiptImage;
  recognize: (
    image: Blob,
    onProgress: (progress: OcrProgress) => void,
    signal: AbortSignal,
  ) => Promise<OcrTextResult>;
};

const defaultDependencies: ReceiptScanDependencies = {
  validate: validateReceiptImage,
  preprocess: preprocessReceiptImage,
  recognize: recognizeReceipt,
};

export class ReceiptScanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReceiptScanError";
  }
}

export async function scanReceiptFile(
  file: File,
  onProgress: (progress: OcrProgress) => void,
  signal: AbortSignal,
  dependencies: ReceiptScanDependencies = defaultDependencies,
): Promise<ParsedReceipt> {
  const validation = await dependencies.validate(file);

  if (!validation.ok) {
    throw new ReceiptScanError(validation.error);
  }

  let processedImage: Blob;

  try {
    processedImage = await dependencies.preprocess(file);
  } catch {
    throw new ReceiptScanError(IMAGE_DECODE_ERROR);
  }

  let ocrResult: OcrTextResult;

  try {
    ocrResult = await dependencies.recognize(processedImage, onProgress, signal);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ReceiptScanError(OCR_RUNTIME_ERROR);
  }

  if (!isReceiptTextRecognizable(ocrResult.text)) {
    throw new ReceiptScanError(UNREADABLE_RECEIPT_ERROR);
  }

  return parseReceiptText(ocrResult.text);
}
