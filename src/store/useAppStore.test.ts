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
    vi.useRealTimers();
    resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it("saves snapshots and replaces a saved split loaded back into the draft", () => {
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
    expect(useAppStore.getState().draft.sourceSplitId).toBe(savedSplit.id);
    expect(useAppStore.getState().draft.title).toBe(savedSplit.title);

    useAppStore.getState().setDraftTitle("Changed split");
    const updateResult = useAppStore.getState().saveDraft();

    expect(updateResult.ok).toBe(true);
    expect(updateResult.splitId).toBe(savedSplit.id);
    expect(useAppStore.getState().savedSplits).toHaveLength(1);
    expect(useAppStore.getState().savedSplits[0].id).toBe(savedSplit.id);
    expect(useAppStore.getState().savedSplits[0].createdAt).toBe(savedSplit.createdAt);
    expect(useAppStore.getState().savedSplits[0].title).toBe("Changed split");
  });

  it("does not replace a saved split when the loaded draft has no meaningful changes", () => {
    const store = useAppStore.getState();

    store.setDraftTitle("Pizza night");
    store.addParticipant("Alex");
    const payerId = useAppStore.getState().draft.participants[0]?.id ?? "";
    store.addItem({
      name: "Large pizza",
      amountCents: 2400,
      participantIds: [payerId],
    });
    const saveResult = store.saveDraft();
    expect(saveResult.ok).toBe(true);

    const savedSplit = useAppStore.getState().savedSplits[0];
    const savedSplits = useAppStore.getState().savedSplits;
    const loadResult = useAppStore.getState().loadSavedSplitToDraft(savedSplit.id);
    expect(loadResult.ok).toBe(true);

    const noOpSaveResult = useAppStore.getState().saveDraft();

    expect(noOpSaveResult.ok).toBe(true);
    expect(noOpSaveResult.splitId).toBe(savedSplit.id);
    expect(useAppStore.getState().savedSplits).toBe(savedSplits);
    expect(useAppStore.getState().savedSplits[0]).toBe(savedSplit);
  });

  it("preserves the original saved date and updates the modified date when replacing a changed saved split", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T12:00:00.000Z"));

    const store = useAppStore.getState();

    store.setDraftTitle("Pizza night");
    store.addParticipant("Alex");
    const payerId = useAppStore.getState().draft.participants[0]?.id ?? "";
    store.addItem({
      name: "Large pizza",
      amountCents: 2400,
      participantIds: [payerId],
    });
    const saveResult = store.saveDraft();
    expect(saveResult.ok).toBe(true);

    const savedSplit = useAppStore.getState().savedSplits[0];
    useAppStore.getState().loadSavedSplitToDraft(savedSplit.id);
    useAppStore.getState().setDraftTitle("Changed split");

    vi.setSystemTime(new Date("2026-05-22T09:30:00.000Z"));
    const updateResult = useAppStore.getState().saveDraft();

    expect(updateResult.ok).toBe(true);
    expect(useAppStore.getState().savedSplits[0].id).toBe(savedSplit.id);
    expect(useAppStore.getState().savedSplits[0].createdAt).toBe("2026-05-21T12:00:00.000Z");
    expect(useAppStore.getState().savedSplits[0].updatedAt).toBe("2026-05-22T09:30:00.000Z");

    vi.useRealTimers();
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

  it("initializes repayment tracking when saving a draft", () => {
    const store = useAppStore.getState();

    store.setDraftTitle("Repayment dinner");
    store.addParticipant("Alex");
    store.addParticipant("Blair");
    const participantIds = useAppStore.getState().draft.participants.map((participant) => participant.id);

    store.addItem({
      name: "Burger",
      amountCents: 1200,
      participantIds: [participantIds[1]],
    });

    expect(store.saveDraft().ok).toBe(true);
    expect(useAppStore.getState().savedSplits[0].paidParticipantIds).toEqual([]);
  });

  it("toggles a saved owed participant as paid and updates the saved split timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T10:00:00.000Z"));

    const store = useAppStore.getState();

    store.setDraftTitle("Paid dinner");
    store.addParticipant("Alex");
    store.addParticipant("Blair");
    const participantIds = useAppStore.getState().draft.participants.map((participant) => participant.id);
    const friendId = participantIds[1];

    store.addItem({
      name: "Burger",
      amountCents: 1200,
      participantIds: [friendId],
    });
    store.saveDraft();

    const savedSplit = useAppStore.getState().savedSplits[0];

    vi.setSystemTime(new Date("2026-05-21T11:00:00.000Z"));
    expect(useAppStore.getState().toggleSavedSplitParticipantPaid(savedSplit.id, friendId)).toEqual({ ok: true });

    expect(useAppStore.getState().savedSplits[0].paidParticipantIds).toEqual([friendId]);
    expect(useAppStore.getState().savedSplits[0].updatedAt).toBe("2026-05-21T11:00:00.000Z");

    expect(useAppStore.getState().toggleSavedSplitParticipantPaid(savedSplit.id, friendId)).toEqual({ ok: true });
    expect(useAppStore.getState().savedSplits[0].paidParticipantIds).toEqual([]);
  });

  it("rejects toggling a participant who does not currently owe the payer", () => {
    const store = useAppStore.getState();

    store.setDraftTitle("Invalid repayment");
    store.addParticipant("Alex");
    store.addParticipant("Blair");
    const participantIds = useAppStore.getState().draft.participants.map((participant) => participant.id);
    const payerId = participantIds[0];
    const friendId = participantIds[1];

    store.addItem({
      name: "Tea",
      amountCents: 500,
      participantIds: [payerId],
    });
    store.saveDraft();

    const savedSplit = useAppStore.getState().savedSplits[0];

    expect(useAppStore.getState().toggleSavedSplitParticipantPaid(savedSplit.id, friendId)).toEqual({
      ok: false,
      error: "Only participants who owe the payer can be marked paid.",
    });
    expect(useAppStore.getState().savedSplits[0]).toEqual(savedSplit);
  });

  it("carries paid status into an edited saved split and prunes people who no longer owe", () => {
    const store = useAppStore.getState();

    store.setDraftTitle("Edited repayment");
    store.addParticipant("Alex");
    store.addParticipant("Blair");
    store.addParticipant("Casey");
    const participantIds = useAppStore.getState().draft.participants.map((participant) => participant.id);
    const blairId = participantIds[1];
    const caseyId = participantIds[2];

    store.addItem({
      name: "Burger",
      amountCents: 1200,
      participantIds: [blairId],
    });
    store.addItem({
      name: "Fries",
      amountCents: 900,
      participantIds: [caseyId],
    });
    store.saveDraft();

    const savedSplit = useAppStore.getState().savedSplits[0];
    useAppStore.getState().toggleSavedSplitParticipantPaid(savedSplit.id, blairId);
    useAppStore.getState().toggleSavedSplitParticipantPaid(savedSplit.id, caseyId);

    expect(useAppStore.getState().loadSavedSplitToDraft(savedSplit.id)).toEqual({ ok: true });
    useAppStore.getState().updateItem(useAppStore.getState().draft.items[1].id, {
      name: "Fries",
      amountCents: 900,
      participantIds: [useAppStore.getState().draft.payerId ?? ""],
    });

    expect(useAppStore.getState().saveDraft().ok).toBe(true);
    expect(useAppStore.getState().savedSplits[0].paidParticipantIds).toEqual([blairId]);
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

  it("replaces existing receipt data atomically", () => {
    const store = useAppStore.getState();
    store.addParticipant("Alex");
    const participantId = useAppStore.getState().draft.participants[0].id;
    store.addItem({
      name: "Old item",
      amountCents: 500,
      participantIds: [participantId],
    });
    store.setTaxCents(50);
    store.setTipCents(100);

    const result = useAppStore.getState().importReceipt({
      items: [
        {
          name: "Scanned item",
          amountCents: 1250,
          participantIds: [participantId],
        },
      ],
      taxCents: 110,
      tipCents: 200,
      strategy: "replace",
    });

    expect(result).toEqual({ ok: true });
    expect(useAppStore.getState().draft.items).toEqual([
      expect.objectContaining({
        name: "Scanned item",
        amountCents: 1250,
        participantIds: [participantId],
      }),
    ]);
    expect(useAppStore.getState().draft.items[0].id).toEqual(expect.any(String));
    expect(useAppStore.getState().draft.taxCents).toBe(110);
    expect(useAppStore.getState().draft.tipCents).toBe(200);
  });

  it("appends scanned items and adds scanned charges", () => {
    const store = useAppStore.getState();
    store.addParticipant("Alex");
    const participantId = useAppStore.getState().draft.participants[0].id;
    store.addItem({
      name: "Existing item",
      amountCents: 500,
      participantIds: [participantId],
    });
    store.setTaxCents(50);
    store.setTipCents(100);

    expect(
      useAppStore.getState().importReceipt({
        items: [
          {
            name: "Scanned item",
            amountCents: 1250,
            participantIds: [participantId],
          },
        ],
        taxCents: 110,
        tipCents: 200,
        strategy: "append",
      }),
    ).toEqual({ ok: true });

    expect(useAppStore.getState().draft.items.map((item) => item.name)).toEqual([
      "Existing item",
      "Scanned item",
    ]);
    expect(useAppStore.getState().draft.taxCents).toBe(160);
    expect(useAppStore.getState().draft.tipCents).toBe(300);
  });

  it("leaves the draft unchanged when a receipt import is invalid", () => {
    const store = useAppStore.getState();
    store.addParticipant("Alex");
    const participantId = useAppStore.getState().draft.participants[0].id;
    const draftBeforeImport = useAppStore.getState().draft;

    const result = useAppStore.getState().importReceipt({
      items: [
        {
          name: "",
          amountCents: 1250,
          participantIds: [participantId],
        },
      ],
      taxCents: 100,
      tipCents: 200,
      strategy: "replace",
    });

    expect(result).toEqual({ ok: false, error: "Item name is required." });
    expect(useAppStore.getState().draft).toBe(draftBeforeImport);
  });
});
