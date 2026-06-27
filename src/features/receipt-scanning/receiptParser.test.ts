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

  it("extracts table-style item quantities and plural taxes", () => {
    const result = parseReceiptText(`
      ITEM QTY PRICE
      CAUSA DE POLLO 1 $8,95
      CEVICHE DE CAMARONES 1 $16.95 a
      LIMONADA 1 $4.00
      PESCADO AL AJILLO 1 $15.95
      Subtotal $45.85
      Total Taxes $3.67
      Grand Total $49.52
      Amount Due: $49.52
      15% 20% 25%
      $7.43 $9.90 $12.38
      TIP IS NOT INCLUDED
    `);

    expect(result.items).toEqual([
      {
        name: "CAUSA DE POLLO",
        amountCents: 895,
        sourceLine: "CAUSA DE POLLO 1 $8,95",
      },
      {
        name: "CEVICHE DE CAMARONES",
        amountCents: 1695,
        sourceLine: "CEVICHE DE CAMARONES 1 $16.95 a",
      },
      { name: "LIMONADA", amountCents: 400, sourceLine: "LIMONADA 1 $4.00" },
      {
        name: "PESCADO AL AJILLO",
        amountCents: 1595,
        sourceLine: "PESCADO AL AJILLO 1 $15.95",
      },
    ]);
    expect(result.subtotalCents).toBe(4585);
    expect(result.taxCents).toBe(367);
    expect(result.tipCents).toBeNull();
    expect(result.totalCents).toBe(4952);
    expect(result.warnings).toEqual([]);
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

  it("does not use modifier or custom instruction lines as item names", () => {
    const result = parseReceiptText(`
      Burger
      No onions
      $12.00
      Fries
      $5.00
      Subtotal $17.00
    `);

    expect(result.items).toEqual([
      {
        name: "Burger",
        amountCents: 1200,
        sourceLine: "Burger No onions $12.00",
      },
      { name: "Fries", amountCents: 500, sourceLine: "Fries $5.00" },
    ]);
  });

  it("does not import service charges or fees as items", () => {
    const result = parseReceiptText(`
      Burger 12.00
      Service Charge 2.00
      Convenience Fee $1.50
      Subtotal 12.00
      Tax 1.00
      Total 16.50
    `);

    expect(result.items).toEqual([
      { name: "Burger", amountCents: 1200, sourceLine: "Burger 12.00" },
    ]);
    expect(result.warnings).toContain("Service charges or fees require manual review.");
  });

  it("only imports priced rows from the detected item section", () => {
    const result = parseReceiptText(`
      CORNER CAFE 555.1212
      Rewards balance 10.00
      ITEM QTY PRICE
      Burger 1 $12.00
      Fries 1 $5.00
      Subtotal $17.00
      Payment Visa $18.50
      Visit us again 20.00
    `);

    expect(result.items).toEqual([
      { name: "Burger", amountCents: 1200, sourceLine: "Burger 1 $12.00" },
      { name: "Fries", amountCents: 500, sourceLine: "Fries 1 $5.00" },
    ]);
  });

  it("uses lines before the first summary when no item header is detected", () => {
    const result = parseReceiptText(`
      Tacos 8.00
      Soda 2.00
      Subtotal 10.00
      Visa 10.80
    `);

    expect(result.items).toEqual([
      { name: "Tacos", amountCents: 800, sourceLine: "Tacos 8.00" },
      { name: "Soda", amountCents: 200, sourceLine: "Soda 2.00" },
    ]);
  });

  it("does not import discounts, coupons, promos, or fee variants as items", () => {
    const result = parseReceiptText(`
      Sandwich 10.00
      Coupon 1.00
      Promo 2.00
      Admin Fee 0.75
      Delivery Fee 3.00
      Credit Card Fee 0.45
      Subtotal 10.00
    `);

    expect(result.items).toEqual([
      { name: "Sandwich", amountCents: 1000, sourceLine: "Sandwich 10.00" },
    ]);
    expect(result.warnings).toContain("Discounts or negative amounts require manual review.");
    expect(result.warnings).toContain("Service charges or fees require manual review.");
  });

  it("does not import suggested tip lines as items or actual tip", () => {
    const result = parseReceiptText(`
      Pasta 20.00
      Subtotal 20.00
      Tax 1.60
      Total 21.60
      Suggested Tip 18% $3.89
      Suggested Tip 20% $4.32
    `);

    expect(result.items).toEqual([
      { name: "Pasta", amountCents: 2000, sourceLine: "Pasta 20.00" },
    ]);
    expect(result.tipCents).toBeNull();
  });

  it("warns when likely item rows in the item section have no usable price", () => {
    const result = parseReceiptText(`
      ITEM QTY PRICE
      Causa de Pollo i AE da fe
      Ceviche 1 $16.95
      Subtotal $25.90
    `);

    expect(result.items).toEqual([
      { name: "Ceviche", amountCents: 1695, sourceLine: "Ceviche 1 $16.95" },
    ]);
    expect(result.warnings).toContain("Some item rows could not be matched with prices.");
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
