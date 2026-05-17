import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SplitEditorPage } from "@/routes/SplitEditorPage";
import { useAppStore } from "@/store/useAppStore";
import { createEmptyDraft } from "@/utils/draft";

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function resetStore() {
  localStorage.clear();
  useAppStore.persist.clearStorage();
  useAppStore.setState((state) => ({
    ...state,
    draft: createEmptyDraft(),
    savedSplits: [],
  }));
  navigateMock.mockReset();
}

function seedValidDraft() {
  const store = useAppStore.getState();
  store.setDraftTitle("Dinner");
  store.addParticipant("Alex");

  const payerId = useAppStore.getState().draft.participants[0]?.id ?? "";
  store.addItem({
    name: "Burger",
    amountCents: 1200,
    participantIds: [payerId],
  });
}

describe("SplitEditorPage", () => {
  beforeEach(() => {
    resetStore();
  });

  it("does not save while an existing item edit is invalid but uncommitted", async () => {
    const user = userEvent.setup();
    seedValidDraft();

    render(<SplitEditorPage />);

    const existingAmountInput = screen.getAllByLabelText("Amount")[1];
    await user.clear(existingAmountInput);
    await user.type(existingAmountInput, "0");
    await user.click(screen.getAllByRole("button", { name: /save split/i })[0]);

    expect(screen.getAllByText("Item amount must be greater than zero.").length).toBeGreaterThan(0);
    expect(useAppStore.getState().savedSplits).toHaveLength(0);
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
