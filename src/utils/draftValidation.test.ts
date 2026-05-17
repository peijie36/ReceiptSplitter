import { validateItemInput } from "@/utils/draftValidation";

const participants = [{ id: "payer", name: "Alex" }];

describe("draft validation", () => {
  it.each([
    ["fractional", 1250.5],
    ["NaN", Number.NaN],
    ["infinite", Number.POSITIVE_INFINITY],
    ["unsafe", Number.MAX_SAFE_INTEGER + 1],
  ])("rejects %s item cent amounts", (_label, amountCents) => {
    expect(
      validateItemInput(
        {
          name: "Soup",
          amountCents,
          participantIds: ["payer"],
        },
        participants,
      ),
    ).toBe("Item amount must be a whole number of cents.");
  });
});
