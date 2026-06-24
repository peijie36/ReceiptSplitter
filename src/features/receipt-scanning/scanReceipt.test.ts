import { describe, expect, it, vi } from "vitest";

import { scanReceiptFile } from "@/features/receipt-scanning/scanReceipt";

describe("scanReceiptFile", () => {
  it("returns parsed receipt data after validation, preprocessing, and OCR", async () => {
    const processedImage = new Blob(["processed"]);
    const onProgress = vi.fn();

    const result = await scanReceiptFile(
      new File(["receipt"], "receipt.jpg", { type: "image/jpeg" }),
      onProgress,
      new AbortController().signal,
      {
        validate: vi.fn(async () => ({
          ok: true as const,
          dimensions: { width: 1000, height: 2000 },
        })),
        preprocess: vi.fn(async () => processedImage),
        recognize: vi.fn(async () => ({
          text: "CAFE RECEIPT\nLatte 4.50\nTax 0.40\nTotal 4.90",
          confidence: 91,
        })),
      },
    );

    expect(result.items).toEqual([
      { name: "Latte", amountCents: 450, sourceLine: "Latte 4.50" },
    ]);
    expect(result.taxCents).toBe(40);
    expect(result.totalCents).toBe(490);
  });

  it("surfaces validation errors without starting OCR", async () => {
    const recognize = vi.fn();

    await expect(
      scanReceiptFile(
        new File(["receipt"], "receipt.gif", { type: "image/gif" }),
        vi.fn(),
        new AbortController().signal,
        {
          validate: vi.fn(async () => ({
            ok: false as const,
            error: "Choose a JPEG, PNG, or WebP image.",
          })),
          preprocess: vi.fn(),
          recognize,
        },
      ),
    ).rejects.toThrow("Choose a JPEG, PNG, or WebP image.");
    expect(recognize).not.toHaveBeenCalled();
  });

  it("uses the unreadable-receipt message when OCR has no plausible fields", async () => {
    await expect(
      scanReceiptFile(
        new File(["receipt"], "receipt.jpg", { type: "image/jpeg" }),
        vi.fn(),
        new AbortController().signal,
        {
          validate: vi.fn(async () => ({
            ok: true as const,
            dimensions: { width: 1000, height: 2000 },
          })),
          preprocess: vi.fn(async () => new Blob(["processed"])),
          recognize: vi.fn(async () => ({
            text: "THANK YOU FOR VISITING OUR RESTAURANT PLEASE COME AGAIN",
            confidence: 20,
          })),
        },
      ),
    ).rejects.toThrow(
      "We couldn't read this receipt. Try a sharper, well-lit image with the full receipt visible, or enter it manually.",
    );
  });
});
