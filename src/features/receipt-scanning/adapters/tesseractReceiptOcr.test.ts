import { describe, expect, it, vi } from "vitest";

import { recognizeReceipt } from "@/features/receipt-scanning/adapters/tesseractReceiptOcr";

describe("recognizeReceipt", () => {
  it("reports progress, returns normalized text, and terminates the worker", async () => {
    const terminate = vi.fn(async () => undefined);
    const recognize = vi.fn(async () => ({
      data: {
        text: "  LATTE   4.50 \n\n TAX 0.40  ",
        confidence: 87,
      },
    }));
    let logger: ((message: { status: string; progress: number }) => void) | undefined;
    const createWorker = vi.fn(async (_language, _oem, options) => {
      logger = options?.logger;
      return { recognize, terminate };
    });
    const onProgress = vi.fn();

    const promise = recognizeReceipt(
      new Blob(["image"]),
      onProgress,
      new AbortController().signal,
      createWorker,
    );
    logger?.({ status: "recognizing text", progress: 0.5 });

    await expect(promise).resolves.toEqual({
      text: "LATTE 4.50\nTAX 0.40",
      confidence: 87,
    });
    expect(onProgress).toHaveBeenCalledWith({
      status: "recognizing text",
      progress: 0.5,
    });
    expect(terminate).toHaveBeenCalledOnce();
  });

  it("terminates the worker when recognition is cancelled", async () => {
    let rejectRecognition: ((error: Error) => void) | undefined;
    const recognize = vi.fn(
      () =>
        new Promise<{ data: { text: string; confidence?: number } }>((_, reject) => {
          rejectRecognition = reject;
        }),
    );
    const terminate = vi.fn(async () => {
      rejectRecognition?.(new Error("terminated"));
    });
    const createWorker = vi.fn(async () => ({ recognize, terminate }));
    const controller = new AbortController();

    const promise = recognizeReceipt(
      new Blob(["image"]),
      vi.fn(),
      controller.signal,
      createWorker,
    );
    await Promise.resolve();
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(terminate).toHaveBeenCalledOnce();
  });
});
