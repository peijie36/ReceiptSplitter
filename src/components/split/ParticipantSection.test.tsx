import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ParticipantSection } from "@/components/split/ParticipantSection";
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

describe("ParticipantSection", () => {
  beforeEach(() => {
    resetStore();
  });

  it("updates participant names on blur without an update button", async () => {
    const user = userEvent.setup();
    const store = useAppStore.getState();

    store.addParticipant("Alex");

    render(<ParticipantSection />);

    const nameInput = screen.getByLabelText("Name");
    expect(screen.queryByRole("button", { name: /update/i })).not.toBeInTheDocument();

    await user.clear(nameInput);
    await user.type(nameInput, "Jordan");
    await user.tab();

    expect(useAppStore.getState().draft.participants[0]?.name).toBe("Jordan");
  });
});
