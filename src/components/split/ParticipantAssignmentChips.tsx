import { Check, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Participant } from "@/types/split";
import { cn } from "@/lib/utils";

type ParticipantAssignmentChipsProps = {
  participants: Participant[];
  selectedParticipantIds: string[];
  onSelectedParticipantIdsChange: (participantIds: string[]) => void;
};

function orderParticipantIds(participants: Participant[], participantIds: string[]) {
  const selectedIds = new Set(participantIds);
  return participants.filter((participant) => selectedIds.has(participant.id)).map((participant) => participant.id);
}

export function ParticipantAssignmentChips({
  participants,
  selectedParticipantIds,
  onSelectedParticipantIdsChange,
}: ParticipantAssignmentChipsProps) {
  const orderedSelectedParticipantIds = orderParticipantIds(participants, selectedParticipantIds);
  const selectedIds = new Set(orderedSelectedParticipantIds);
  const allParticipantIds = participants.map((participant) => participant.id);
  const allSelected = participants.length > 0 && participants.every((participant) => selectedIds.has(participant.id));

  function handleToggle(participantId: string) {
    const nextIds = selectedIds.has(participantId)
      ? orderedSelectedParticipantIds.filter((selectedId) => selectedId !== participantId)
      : orderParticipantIds(participants, [...orderedSelectedParticipantIds, participantId]);

    onSelectedParticipantIdsChange(nextIds);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          aria-label="Assign all participants"
          onClick={() => onSelectedParticipantIdsChange(allParticipantIds)}
          disabled={allSelected}
        >
          <Users className="h-4 w-4" />
          All
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label="Clear participant assignments"
          onClick={() => onSelectedParticipantIdsChange([])}
          disabled={orderedSelectedParticipantIds.length === 0}
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {participants.map((participant) => {
          const isSelected = selectedIds.has(participant.id);

          return (
            <button
              key={participant.id}
              type="button"
              aria-pressed={isSelected}
              aria-label={isSelected ? `Remove ${participant.name}` : `Assign ${participant.name}`}
              onClick={() => handleToggle(participant.id)}
              className={cn(
                "inline-flex min-h-8 items-center gap-2 rounded-md border px-2.5 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  : "border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {isSelected ? <Check className="h-4 w-4" /> : null}
              <span>{participant.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
