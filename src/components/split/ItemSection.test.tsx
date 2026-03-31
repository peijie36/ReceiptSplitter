import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ItemSection } from "@/components/split/ItemSection";
import { useAppStore } from "@/store/useAppStore";
import { createEmptyDraft } from "@/utils/draft";

function resetStore() {
  localStorage.clear();
  useAppStore.persist.clearStorage();
  useAppStore.setState((state) => ({
    ...state,
    draft: createEmptyDraft(),
    savedSplits: [],
  }));
}

describe("ItemSection", () => {
  beforeEach(() => {
    resetStore();
  });

  it("clears a stale item-name error once the user starts correcting the draft item", async () => {
    const user = userEvent.setup();
    const store = useAppStore.getState();

    store.addParticipant("Alex");

    render(<ItemSection />);

    await user.click(screen.getByRole("button", { name: /add item/i }));

    expect(screen.getByText("Item name is required.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Item name"), "Burger");

    expect(screen.queryByText("Item name is required.")).not.toBeInTheDocument();
  });

  it("commits existing item name edits on blur", async () => {
    const user = userEvent.setup();

    useAppStore.setState((state) => ({
      ...state,
      draft: {
        ...createEmptyDraft(),
        payerId: "payer-1",
        participants: [{ id: "payer-1", name: "Alex" }],
        items: [
          {
            id: "item-1",
            name: "",
            amountCents: 1200,
            participantIds: ["payer-1"],
          },
        ],
      },
    }));

    render(<ItemSection />);

    const itemNameInput = screen.getByLabelText("Item");

    await user.type(itemNameInput, "Burger");
    await user.tab();

    expect(useAppStore.getState().draft.items[0]?.name).toBe("Burger");
  });
});
