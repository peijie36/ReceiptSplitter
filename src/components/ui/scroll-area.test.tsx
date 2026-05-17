import { render, screen, waitFor } from "@testing-library/react";

import { ScrollArea } from "@/components/ui/scroll-area";

describe("ScrollArea", () => {
  it("allows overflowing vertical content to be scrolled", async () => {
    render(
      <ScrollArea className="max-h-10" aria-label="Scrollable content">
        <div>First row</div>
        <div>Second row</div>
        <div>Third row</div>
        <div>Fourth row</div>
      </ScrollArea>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Scrollable content").firstElementChild).toHaveClass(
        "max-h-[inherit]",
        "overflow-y-auto",
      );
    });
  });
});
