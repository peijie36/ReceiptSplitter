import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { HomePage } from "@/routes/HomePage";
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

describe("HomePage", () => {
  beforeEach(() => {
    resetStore();
  });

  it("confirms before starting fresh when a draft has content", async () => {
    const user = userEvent.setup();
    useAppStore.getState().setDraftTitle("Dinner");

    render(<HomePage />);

    await user.click(screen.getByRole("button", { name: /start fresh split/i }));

    expect(screen.getByText("Reset the current draft?")).toBeInTheDocument();
    expect(useAppStore.getState().draft.title).toBe("Dinner");
    expect(navigateMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Start fresh" }));

    expect(useAppStore.getState().draft.title).toBe("");
    expect(navigateMock).toHaveBeenCalledWith({ to: "/split/new" });
  });
});
