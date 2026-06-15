import { formatShortDateTime } from "@/utils/date";

describe("date formatting", () => {
  it("formats short date and time consistently", () => {
    const isoDate = "2026-06-15T12:34:00.000Z";
    const expected = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(isoDate));

    expect(formatShortDateTime(isoDate)).toBe(expected);
  });
});
