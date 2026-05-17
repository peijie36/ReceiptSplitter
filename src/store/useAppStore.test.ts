import { createEmptyDraft } from "@/utils/draft";
import { useAppStore } from "@/store/useAppStore";

const STORAGE_KEY = "receipt-splitter-store";

function resetStore() {
  localStorage.clear();
  useAppStore.persist.clearStorage();
  useAppStore.setState((state) => ({
    ...state,
    draft: createEmptyDraft(),
    savedSplits: [],
  }));
}

describe("useAppStore", () => {
  beforeEach(() => {
    resetStore();
  });

  it("persists the current draft and can rehydrate it", async () => {
    useAppStore.getState().setDraftTitle("Lunch run");
    useAppStore.getState().addParticipant("Alex");
    useAppStore.getState().addParticipant("Blair");
    const participantIds = useAppStore.getState().draft.participants.map((participant) => participant.id);
    useAppStore.getState().addItem({
      name: "Sandwich",
      amountCents: 1250,
      participantIds: [participantIds[1]],
    });
    const persistedState = localStorage.getItem(STORAGE_KEY);

    useAppStore.setState((state) => ({
      ...state,
      draft: createEmptyDraft(),
      savedSplits: [],
    }));
    localStorage.setItem(STORAGE_KEY, persistedState ?? "");

    await useAppStore.persist.rehydrate();

    expect(useAppStore.getState().draft.title).toBe("Lunch run");
    expect(useAppStore.getState().draft.participants).toHaveLength(2);
    expect(useAppStore.getState().draft.items).toHaveLength(1);
  });

  it("saves immutable snapshots and loads a copy back into the draft", () => {
    const store = useAppStore.getState();

    store.setDraftTitle("Pizza night");
    store.addParticipant("Alex");
    store.addParticipant("Blair");

    const participantIds = useAppStore.getState().draft.participants.map((participant) => participant.id);
    const payerId = participantIds[0];
    const friendId = participantIds[1];

    store.setPayer(payerId);
    store.addItem({
      name: "Large pizza",
      amountCents: 2400,
      participantIds: [payerId, friendId],
    });

    const saveResult = useAppStore.getState().saveDraft();
    expect(saveResult.ok).toBe(true);
    expect(saveResult.splitId).toBeDefined();

    const savedSplit = useAppStore.getState().savedSplits[0];
    expect(savedSplit.title).toBe("Pizza night");

    const loadResult = useAppStore.getState().loadSavedSplitToDraft(savedSplit.id);
    expect(loadResult.ok).toBe(true);
    expect(useAppStore.getState().draft.id).not.toBe(savedSplit.id);
    expect(useAppStore.getState().draft.title).toBe(savedSplit.title);

    useAppStore.getState().setDraftTitle("Changed copy");
    expect(useAppStore.getState().savedSplits[0].title).toBe("Pizza night");
  });

  it("refuses to save an invalid draft", () => {
    const result = useAppStore.getState().saveDraft();

    expect(result.ok).toBe(false);
    expect(useAppStore.getState().savedSplits).toHaveLength(0);
  });

  it("saves an equal-mode draft without requiring items", () => {
    const store = useAppStore.getState();

    store.setDraftTitle("Utility bill");
    store.addParticipant("Alex");
    store.addParticipant("Blair");

    const participantIds = useAppStore.getState().draft.participants.map((participant) => participant.id);
    store.setPayer(participantIds[0]);
    store.setSplitMode("equal");
    store.setBillSubtotalCents(8000);
    store.setTaxCents(640);
    store.setTipCents(0);

    const saveResult = store.saveDraft();

    expect(saveResult.ok).toBe(true);
    expect(useAppStore.getState().savedSplits[0].splitMode).toBe("equal");
    expect(useAppStore.getState().savedSplits[0].billSubtotalCents).toBe(8000);
    expect(useAppStore.getState().savedSplits[0].items).toHaveLength(0);
  });

  it("rejects invalid cent values at the store boundary", () => {
    const store = useAppStore.getState();

    store.addParticipant("Alex");
    const participantId = useAppStore.getState().draft.participants[0]?.id ?? "";

    expect(
      store.addItem({
        name: "Soup",
        amountCents: Number.NaN,
        participantIds: [participantId],
      }),
    ).toEqual({
      ok: false,
      error: "Item amount must be a whole number of cents.",
    });
    expect(store.setBillSubtotalCents(1000.5)).toEqual({
      ok: false,
      error: "Subtotal must be a whole number of cents.",
    });
    expect(store.setTaxCents(Number.POSITIVE_INFINITY)).toEqual({
      ok: false,
      error: "Tax must be a whole number of cents.",
    });
    expect(store.setTipCents(Number.MAX_SAFE_INTEGER + 1)).toEqual({
      ok: false,
      error: "Tip must be a whole number of cents.",
    });
  });
});
