import { describe, expect, it } from "vitest";

import {
  isReceiptTextRecognizable,
  parseReceiptText,
} from "@/features/receipt-scanning/receiptParser";

describe("parseReceiptText", () => {
  it("extracts item lines and common receipt totals", () => {
    const result = parseReceiptText(`
      CORNER CAFE
      Latte                 $4.50
      Breakfast Sandwich    8.25
      Subtotal             12.75
      Sales Tax             1.08
      Tip                   2.00
      Total                15.83
      Visa ending 4242
    `);

    expect(result.items).toEqual([
      { name: "Latte", amountCents: 450, sourceLine: "Latte $4.50" },
      {
        name: "Breakfast Sandwich",
        amountCents: 825,
        sourceLine: "Breakfast Sandwich 8.25",
      },
    ]);
    expect(result.subtotalCents).toBe(1275);
    expect(result.taxCents).toBe(108);
    expect(result.tipCents).toBe(200);
    expect(result.totalCents).toBe(1583);
    expect(result.warnings).toEqual([]);
  });

  it("joins an item name with a following price-only line", () => {
    const result = parseReceiptText(`
      2 Green Curry
      $14.95
      GRATUITY 3.00
      AMOUNT DUE 17.95
    `);

    expect(result.items).toEqual([
      {
        name: "Green Curry",
        amountCents: 1495,
        sourceLine: "2 Green Curry $14.95",
      },
    ]);
    expect(result.tipCents).toBe(300);
    expect(result.totalCents).toBe(1795);
  });

  it("removes standalone leading item quantities without changing numeric product names", () => {
    const result = parseReceiptText(`
      1 Tacos Del Mal Shrimp $14.98
      1 Especial Salad Chicken $12.50
      1 Fountain Beverage $1.99
      7-Up $2.50
      SUBTOTAL $31.97
    `);

    expect(
      result.items.map(({ name, amountCents }) => ({ name, amountCents })),
    ).toEqual([
      { name: "Tacos Del Mal Shrimp", amountCents: 1498 },
      { name: "Especial Salad Chicken", amountCents: 1250 },
      { name: "Fountain Beverage", amountCents: 199 },
      { name: "7-Up", amountCents: 250 },
    ]);
  });

  it("uses the last total and excludes payment metadata from items", () => {
    const result = parseReceiptText(`
      Burger 12.00
      Subtotal 12.00
      Total before tip 12.96
      Tip 2.00
      TOTAL 14.96
      Mastercard 1234 14.96
      AUTH 00991
    `);

    expect(result.items).toEqual([
      { name: "Burger", amountCents: 1200, sourceLine: "Burger 12.00" },
    ]);
    expect(result.totalCents).toBe(1496);
  });

  it("returns partial results and reconciliation warnings", () => {
    const result = parseReceiptText(`
      Pasta 10.00
      Salad 5.00
      Subtotal 16.00
      Tax 1.20
      Total 18.00
    `);

    expect(result.items).toHaveLength(2);
    expect(result.tipCents).toBeNull();
    expect(result.warnings).toEqual([
      "Detected items do not match the receipt subtotal.",
      "Detected amounts do not match the receipt total.",
    ]);
  });

  it("does not import discounts, malformed prices, or summary lines as items", () => {
    const result = parseReceiptText(`
      Pizza 18.00
      Coupon -2.00
      Service Fee 1O.OO
      Sub total 18.00
      Tax $1.50
      Total $19.50
    `);

    expect(result.items).toEqual([
      { name: "Pizza", amountCents: 1800, sourceLine: "Pizza 18.00" },
    ]);
    expect(result.warnings).toContain("Discounts or negative amounts require manual review.");
  });
});

describe("isReceiptTextRecognizable", () => {
  it("rejects short or fieldless OCR text", () => {
    expect(isReceiptTextRecognizable("Total 2.00")).toBe(false);
    expect(
      isReceiptTextRecognizable(
        "THANK YOU FOR VISITING OUR RESTAURANT. PLEASE COME AGAIN SOON.",
      ),
    ).toBe(false);
  });

  it("accepts partial text with a plausible receipt amount", () => {
    expect(
      isReceiptTextRecognizable(`
        THANK YOU FOR VISITING
        Sales tax 1.25
      `),
    ).toBe(true);
  });
});
