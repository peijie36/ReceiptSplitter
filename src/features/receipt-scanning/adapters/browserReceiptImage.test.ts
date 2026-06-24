import { describe, expect, it, vi } from "vitest";

import {
  getScaledReceiptDimensions,
  preprocessReceiptImage,
  validateReceiptImage,
} from "@/features/receipt-scanning/adapters/browserReceiptImage";

describe("validateReceiptImage", () => {
  it("rejects unsupported files before decoding", async () => {
    const readDimensions = vi.fn();
    const file = new File(["receipt"], "receipt.gif", { type: "image/gif" });

    await expect(validateReceiptImage(file, readDimensions)).resolves.toEqual({
      ok: false,
      error: "Choose a JPEG, PNG, or WebP image.",
    });
    expect(readDimensions).not.toHaveBeenCalled();
  });

  it("rejects files larger than 10 MB before decoding", async () => {
    const readDimensions = vi.fn();
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "receipt.jpg", {
      type: "image/jpeg",
    });

    await expect(validateReceiptImage(file, readDimensions)).resolves.toEqual({
      ok: false,
      error: "Choose an image smaller than 10 MB.",
    });
    expect(readDimensions).not.toHaveBeenCalled();
  });

  it("rejects images whose longest edge is below 600 pixels", async () => {
    const file = new File(["receipt"], "receipt.png", { type: "image/png" });

    await expect(
      validateReceiptImage(file, async () => ({ width: 420, height: 599 })),
    ).resolves.toEqual({
      ok: false,
      error: "This image is too small to scan clearly. Try a higher-resolution photo.",
    });
  });

  it("translates decode failures into a usable validation error", async () => {
    const file = new File(["broken"], "receipt.webp", { type: "image/webp" });

    await expect(
      validateReceiptImage(file, async () => {
        throw new Error("decode failed");
      }),
    ).resolves.toEqual({
      ok: false,
      error: "This image could not be opened. Try a different file.",
    });
  });

  it("returns decoded dimensions for valid files", async () => {
    const file = new File(["receipt"], "receipt.jpg", { type: "image/jpeg" });

    await expect(
      validateReceiptImage(file, async () => ({ width: 1200, height: 2400 })),
    ).resolves.toEqual({
      ok: true,
      dimensions: { width: 1200, height: 2400 },
    });
  });
});

describe("getScaledReceiptDimensions", () => {
  it("preserves smaller dimensions", () => {
    expect(getScaledReceiptDimensions(1200, 1800)).toEqual({
      width: 1200,
      height: 1800,
    });
  });

  it("scales the longest edge to 2200 pixels", () => {
    expect(getScaledReceiptDimensions(1500, 3000)).toEqual({
      width: 1100,
      height: 2200,
    });
  });
});

describe("preprocessReceiptImage", () => {
  it("draws a grayscale image at the scaled size and closes the bitmap", async () => {
    const close = vi.fn();
    const bitmap = { width: 1500, height: 3000, close };
    const grayscaleData = new Uint8ClampedArray([100, 150, 200, 255]);
    const imageData = {
      data: grayscaleData,
      width: 1,
      height: 1,
      colorSpace: "srgb",
    } as ImageData;
    const context = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => imageData),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    const output = new Blob(["processed"], { type: "image/png" });
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
      toBlob: (callback: BlobCallback) => callback(output),
    } as unknown as HTMLCanvasElement;

    const result = await preprocessReceiptImage(
      new File(["receipt"], "receipt.jpg", { type: "image/jpeg" }),
      {
        createBitmap: vi.fn(async () => bitmap as unknown as ImageBitmap),
        createCanvas: vi.fn(() => canvas),
      },
    );

    expect(result).toBe(output);
    expect(canvas.width).toBe(1100);
    expect(canvas.height).toBe(2200);
    expect(context.drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 1100, 2200);
    expect(Array.from(grayscaleData)).toEqual([141, 141, 141, 255]);
    expect(close).toHaveBeenCalledOnce();
  });
});
