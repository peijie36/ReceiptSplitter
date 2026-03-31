import { describe, expect, it } from "vitest";

import { formatMoneyInput, normalizeMoneyInput, parseMoneyInput } from "@/utils/money";

describe("money input helpers", () => {
  it("formats cents as dollars and cents for editing", () => {
    expect(formatMoneyInput(1234)).toBe("12.34");
    expect(formatMoneyInput(0, { emptyWhenZero: true })).toBe("");
  });

  it("treats typed digits as cents while preserving an empty field", () => {
    expect(normalizeMoneyInput("", { emptyWhenZero: true })).toEqual({
      displayValue: "",
      cents: 0,
    });

    expect(normalizeMoneyInput("1", { emptyWhenZero: true })).toEqual({
      displayValue: "0.01",
      cents: 1,
    });

    expect(normalizeMoneyInput("1234", { emptyWhenZero: true })).toEqual({
      displayValue: "12.34",
      cents: 1234,
    });
  });

  it("keeps formatted values stable when editing or deleting digits", () => {
    expect(normalizeMoneyInput("1.23", { emptyWhenZero: true })).toEqual({
      displayValue: "1.23",
      cents: 123,
    });

    expect(normalizeMoneyInput("1.2", { emptyWhenZero: true })).toEqual({
      displayValue: "0.12",
      cents: 12,
    });
  });

  it("parses fully formatted amounts by extracting digits into cents", () => {
    expect(parseMoneyInput("12.50")).toEqual({ cents: 1250 });
    expect(parseMoneyInput("$12.50")).toEqual({ cents: 1250 });
  });

  it("rejects negative and oversized values", () => {
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
