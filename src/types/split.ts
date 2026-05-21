export type AllocationMode = "proportional" | "equal";
export type SplitMode = "itemized" | "equal";

export type Participant = {
  id: string;
  name: string;
};

export type Item = {
  id: string;
  name: string;
  amountCents: number;
  participantIds: string[];
};

export type DraftSplit = {
  id: string;
  sourceSplitId: string | null;
  title: string;
  payerId: string | null;
  splitMode: SplitMode;
  participants: Participant[];
  items: Item[];
  billSubtotalCents: number;
  taxCents: number;
  tipCents: number;
  taxAllocationMode: AllocationMode;
  tipAllocationMode: AllocationMode;
  paidParticipantIds: string[];
  updatedAt: string;
};

export type SavedSplit = Omit<DraftSplit, "payerId" | "sourceSplitId"> & {
  payerId: string;
  createdAt: string;
  updatedAt: string;
};

export type ParticipantTotals = {
  participantId: string;
  participantName: string;
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  isPayer: boolean;
};

export type OwedSummaryEntry = {
  participantId: string;
  participantName: string;
  owedCents: number;
};

export type SplitCalculationResult = {
  participantTotals: ParticipantTotals[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  grandTotalCents: number;
  owedSummary: OwedSummaryEntry[];
};

export type ActionResult = {
  ok: boolean;
  error?: string;
};

export type SaveDraftResult = ActionResult & {
  splitId?: string;
};
