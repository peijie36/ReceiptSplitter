import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ReceiptScanner } from "@/features/receipt-scanning/components/ReceiptScanner";

const participants = [{ id: "participant-1", name: "Alex" }];

describe("ReceiptScanner", () => {
  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:receipt-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("reviews and imports recognized receipt fields", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn(() => ({ ok: true }));
    const scanFile = vi.fn(async () => ({
      items: [
        {
          name: "Latte",
          amountCents: 450,
          sourceLine: "Latte 4.50",
        },
      ],
      subtotalCents: 450,
      taxCents: 40,
      tipCents: 100,
      totalCents: 590,
      warnings: [],
    }));

    render(
      <ReceiptScanner
        participants={participants}
        hasExistingReceiptData={false}
        onImport={onImport}
        scanFile={scanFile}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Scan receipt" }));
    await user.upload(
      screen.getByLabelText("Receipt image"),
      new File(["receipt"], "receipt.jpg", { type: "image/jpeg" }),
    );

    expect(await screen.findByDisplayValue("Latte")).toBeInTheDocument();
    expect(screen.getByLabelText("Receipt subtotal")).toHaveValue("4.50");
    expect(screen.getByLabelText("Receipt tax")).toHaveValue("0.40");
    expect(screen.getByLabelText("Receipt tip")).toHaveValue("1.00");
    expect(screen.getByLabelText("Receipt total")).toHaveValue("5.90");

    await user.click(screen.getByRole("button", { name: "Assign Alex" }));
    await user.click(screen.getByRole("button", { name: "Import receipt" }));

    expect(onImport).toHaveBeenCalledWith({
      items: [
        {
          name: "Latte",
          amountCents: 450,
          participantIds: ["participant-1"],
        },
      ],
      taxCents: 40,
      tipCents: 100,
      strategy: "replace",
    });
  });

  it("requires append or replace confirmation when receipt data exists", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn(() => ({ ok: true }));

    render(
      <ReceiptScanner
        participants={participants}
        hasExistingReceiptData
        onImport={onImport}
        scanFile={vi.fn(async () => ({
          items: [
            {
              name: "Soup",
              amountCents: 900,
              sourceLine: "Soup 9.00",
            },
          ],
          subtotalCents: 900,
          taxCents: null,
          tipCents: null,
          totalCents: 900,
          warnings: [],
        }))}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Scan receipt" }));
    await user.upload(
      screen.getByLabelText("Receipt image"),
      new File(["receipt"], "receipt.png", { type: "image/png" }),
    );
    await screen.findByDisplayValue("Soup");
    await user.click(screen.getByRole("button", { name: "Assign Alex" }));
    await user.click(screen.getByRole("button", { name: "Import receipt" }));

    expect(
      screen.getByText("How should this scan update the current receipt?"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Append receipt data" }));

    expect(onImport).toHaveBeenCalledWith(
      expect.objectContaining({
        strategy: "append",
        taxCents: 0,
        tipCents: 0,
      }),
    );
  });

  it("shows recoverable scan errors and supports retry", async () => {
    const user = userEvent.setup();
    const scanFile = vi
      .fn()
      .mockRejectedValueOnce(
        new Error(
          "We couldn't read this receipt. Try a sharper, well-lit image with the full receipt visible, or enter it manually.",
        ),
      )
      .mockResolvedValueOnce({
        items: [],
        subtotalCents: null,
        taxCents: 120,
        tipCents: null,
        totalCents: null,
        warnings: [],
      });

    render(
      <ReceiptScanner
        participants={participants}
        hasExistingReceiptData={false}
        onImport={vi.fn(() => ({ ok: true }))}
        scanFile={scanFile}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Scan receipt" }));
    const input = screen.getByLabelText("Receipt image");
    const file = new File(["receipt"], "receipt.webp", { type: "image/webp" });
    await user.upload(input, file);

    expect(
      await screen.findByText(/We couldn't read this receipt/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry scan" }));

    expect(await screen.findByLabelText("Receipt tax")).toHaveValue("1.20");
    expect(scanFile).toHaveBeenCalledTimes(2);
  });
});
