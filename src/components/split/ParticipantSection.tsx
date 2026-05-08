import { useEffect, useState, type FormEvent } from "react";
import { Trash2, UserPlus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppStore } from "@/store/useAppStore";
import { normalizeName } from "@/utils/draftValidation";

export function ParticipantSection() {
  const draft = useAppStore((state) => state.draft);
  const addParticipant = useAppStore((state) => state.addParticipant);
  const updateParticipantName = useAppStore((state) => state.updateParticipantName);
  const removeParticipant = useAppStore((state) => state.removeParticipant);
  const setPayer = useAppStore((state) => state.setPayer);

  const [newParticipantName, setNewParticipantName] = useState("");
  const [participantDrafts, setParticipantDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setParticipantDrafts((current) =>
      draft.participants.reduce<Record<string, string>>((result, participant) => {
        result[participant.id] = current[participant.id] ?? participant.name;
        return result;
      }, {}),
    );
  }, [draft.participants]);

  function handleAddParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = addParticipant(newParticipantName);

    if (!result.ok) {
      setError(result.error ?? "Unable to add participant.");
      return;
    }

    setNewParticipantName("");
    setError(null);
  }

  function updateParticipantDraft(participantId: string, name: string) {
    setParticipantDrafts((current) => ({
      ...current,
      [participantId]: name,
    }));
  }

  function handleParticipantBlur(participantId: string, currentName: string) {
    const nextName = participantDrafts[participantId] ?? "";
    const normalizedNextName = normalizeName(nextName);

    if (normalizedNextName === currentName) {
      updateParticipantDraft(participantId, currentName);
      setError(null);
      return;
    }

    const result = updateParticipantName(participantId, nextName);

    if (!result.ok) {
      setError(result.error ?? "Unable to update participant.");
      return;
    }

    updateParticipantDraft(participantId, normalizedNextName);
    setError(null);
  }

  function handleRemoveParticipant(participantId: string) {
    const result = removeParticipant(participantId);

    if (!result.ok) {
      setError(result.error ?? "Unable to remove participant.");
      return;
    }

    setError(null);
  }

  function handleSetPayer(participantId: string) {
    const result = setPayer(participantId);

    if (!result.ok) {
      setError(result.error ?? "Unable to set payer.");
      return;
    }

    setError(null);
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
        <CardTitle>Participants</CardTitle>
        <CardDescription>Add everyone involved in the bill and mark who paid.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
        <form className="grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={handleAddParticipant}>
          <div className="space-y-2">
            <Label htmlFor="participant-name">Add participant name</Label>
            <Input
              className="h-9"
              id="participant-name"
              value={newParticipantName}
              placeholder="Alex"
              onChange={(event) => {
                setNewParticipantName(event.target.value);
                setError(null);
              }}
            />
          </div>
          <Button className="w-full self-end sm:w-auto" type="submit" size="sm">
            <UserPlus className="h-4 w-4" />
            Add
          </Button>
        </form>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Participant issue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {draft.participants.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Add at least one participant. The first participant becomes the payer by default.
          </div>
        ) : (
          <RadioGroup value={draft.payerId ?? undefined} onValueChange={(value) => handleSetPayer(String(value))}>
            <div className="space-y-2">
              {draft.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="grid gap-2 rounded-lg border border-border/80 bg-background/70 p-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end"
                >
                  <div>
                    <Label className="sr-only" htmlFor={`participant-${participant.id}`}>
                      Name
                    </Label>
                    <Input
                      className="h-9"
                      id={`participant-${participant.id}`}
                      value={participantDrafts[participant.id] ?? ""}
                      placeholder="Participant name"
                      onChange={(event) => {
                        updateParticipantDraft(participant.id, event.target.value);
                        setError(null);
                      }}
                      onBlur={() => handleParticipantBlur(participant.id, participant.name)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") {
                          return;
                        }

                        event.preventDefault();
                        event.currentTarget.blur();
                      }}
                    />
                  </div>
                  <div className="flex">
                    <label className="inline-flex h-9 w-full items-center gap-3 rounded-md border border-border bg-card px-3 text-sm md:w-auto">
                      <RadioGroupItem value={participant.id} id={`payer-${participant.id}`} />
                      <span>Payer</span>
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full md:w-auto"
                      onClick={() => handleRemoveParticipant(participant.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
}
