import { act, render, screen } from "@testing-library/react";
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

  it("adds an item assigned to a participant subset through chips", async () => {
    const user = userEvent.setup();
    const store = useAppStore.getState();

    store.addParticipant("Alex");
    store.addParticipant("Blair");
    store.addParticipant("Casey");

    render(<ItemSection />);

    await user.type(screen.getByLabelText("Item name"), "Nachos");
    await user.type(screen.getByLabelText("Amount"), "12.50");
    await user.click(screen.getByRole("button", { name: "Assign Alex" }));
    await user.click(screen.getByRole("button", { name: "Assign Casey" }));
    await user.click(screen.getByRole("button", { name: /add item/i }));

    const item = useAppStore.getState().draft.items[0];
    const participantIds = useAppStore.getState().draft.participants.map((participant) => participant.id);

    expect(item?.name).toBe("Nachos");
    expect(item?.amountCents).toBe(1250);
    expect(item?.participantIds).toEqual([participantIds[0], participantIds[2]]);
  });

  it("supports assign all and clear controls for the draft item", async () => {
    const user = userEvent.setup();
    const store = useAppStore.getState();

    store.addParticipant("Alex");
    store.addParticipant("Blair");

    render(<ItemSection />);

    await user.click(screen.getByRole("button", { name: "Assign all participants" }));

    expect(screen.getByRole("button", { name: "Remove Alex" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Remove Blair" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Clear participant assignments" }));

    expect(screen.getByRole("button", { name: "Assign Alex" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Assign Blair" })).toHaveAttribute("aria-pressed", "false");
  });

  it("offers receipt scanning only for itemized splits with participants", () => {
    const store = useAppStore.getState();
    render(<ItemSection />);

    expect(screen.queryByRole("button", { name: "Scan receipt" })).not.toBeInTheDocument();

    act(() => {
      store.addParticipant("Alex");
    });

    expect(screen.getByRole("button", { name: "Scan receipt" })).toBeInTheDocument();

    act(() => {
      store.setSplitMode("equal");
    });

    expect(screen.queryByRole("button", { name: "Scan receipt" })).not.toBeInTheDocument();
  });
});
