import { describe, expect, it } from "vitest";

import { formatMoneyInput, normalizeMoneyInput, parseMoneyInput } from "@/utils/money";

describe("money input helpers", () => {
  it("formats cents as dollars and cents for editing", () => {
    expect(formatMoneyInput(1234)).toBe("12.34");
    expect(formatMoneyInput(0, { emptyWhenZero: true })).toBe("");
  });

  it("treats typed numbers as dollar amounts while preserving an empty field", () => {
    expect(normalizeMoneyInput("", { emptyWhenZero: true })).toEqual({
      displayValue: "",
      cents: 0,
    });

    expect(normalizeMoneyInput("1", { emptyWhenZero: true })).toEqual({
      displayValue: "1",
      cents: 100,
    });

    expect(normalizeMoneyInput("1234", { emptyWhenZero: true })).toEqual({
      displayValue: "1234",
      cents: 123400,
    });
  });

  it("keeps natural decimal values stable while editing", () => {
    expect(normalizeMoneyInput("1.23", { emptyWhenZero: true })).toEqual({
      displayValue: "1.23",
      cents: 123,
    });

    expect(normalizeMoneyInput("1.2", { emptyWhenZero: true })).toEqual({
      displayValue: "1.2",
      cents: 120,
    });

    expect(normalizeMoneyInput("12.", { emptyWhenZero: true })).toEqual({
      displayValue: "12.",
      cents: 1200,
    });
  });

  it("parses plain, decimal, and fully formatted dollar amounts into cents", () => {
    expect(parseMoneyInput("12")).toEqual({ cents: 1200 });
    expect(parseMoneyInput("12.5")).toEqual({ cents: 1250 });
    expect(parseMoneyInput("12.50")).toEqual({ cents: 1250 });
    expect(parseMoneyInput("$12.50")).toEqual({ cents: 1250 });
    expect(parseMoneyInput("1,234.56")).toEqual({ cents: 123456 });
  });

  it("rejects invalid, over-precise, negative, and oversized values", () => {
    expect(parseMoneyInput("12.345")).toEqual({
      cents: null,
      error: "Use at most two decimal places.",
    });

    expect(parseMoneyInput("abc")).toEqual({
      cents: null,
      error: "Enter only numbers and a decimal point.",
    });

    expect(parseMoneyInput("-12.50")).toEqual({
      cents: null,
      error: "Amount cannot be negative.",
    });

    expect(parseMoneyInput("9007199254740992")).toEqual({
      cents: null,
      error: "Amount is too large.",
    });
  });
});
