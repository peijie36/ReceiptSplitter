import type {
  OcrProgress,
  OcrTextResult,
} from "@/features/receipt-scanning/types";

type ReceiptWorker = {
  recognize: (image: Blob) => Promise<{
    data: {
      text: string;
      confidence?: number;
    };
  }>;
  terminate: () => Promise<unknown>;
};

export type ReceiptWorkerFactory = (
  language: string,
  oem: number,
  options: {
    logger: (message: { status: string; progress?: number }) => void;
  },
) => Promise<ReceiptWorker>;

async function createTesseractWorker(
  language: string,
  oem: number,
  options: {
    logger: (message: { status: string; progress?: number }) => void;
  },
) {
  const { createWorker } = await import("tesseract.js");
  return createWorker(language, oem, options);
}

function normalizeOcrText(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join("\n");
}

function createAbortError() {
  return new DOMException("Receipt scanning was cancelled.", "AbortError");
}

export async function recognizeReceipt(
  image: Blob,
  onProgress: (progress: OcrProgress) => void,
  signal: AbortSignal,
  createWorker: ReceiptWorkerFactory = createTesseractWorker,
): Promise<OcrTextResult> {
  let worker: ReceiptWorker | null = null;
  let terminatePromise: Promise<unknown> | null = null;

  const terminate = () => {
    if (!worker) {
      return Promise.resolve();
    }

    terminatePromise ??= worker.terminate();
    return terminatePromise;
  };

  const handleAbort = () => {
    void terminate();
  };

  signal.addEventListener("abort", handleAbort, { once: true });

  try {
    if (signal.aborted) {
      throw createAbortError();
    }

    worker = await createWorker("eng", 1, {
      logger: (message) => {
        onProgress({
          status: message.status,
          progress:
            typeof message.progress === "number" ? message.progress : null,
        });
      },
    });

    if (signal.aborted) {
      await terminate();
      throw createAbortError();
    }

    const result = await worker.recognize(image);

    if (signal.aborted) {
      throw createAbortError();
    }

    return {
      text: normalizeOcrText(result.data.text),
      confidence:
        typeof result.data.confidence === "number"
          ? result.data.confidence
          : null,
    };
  } catch (error) {
    if (signal.aborted) {
      throw createAbortError();
    }

    throw error;
  } finally {
    signal.removeEventListener("abort", handleAbort);
    await terminate();
  }
}
