import { useEffect, useState, type FormEvent } from "react";
import { Trash2, UserPlus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useParticipantEditorModel } from "@/store/useSplitEditor";
import { normalizeName } from "@/utils/draftValidation";

export function ParticipantSection() {
  const {
    draft,
    addParticipant,
    updateParticipantName,
    removeParticipant,
    setPayer,
    setParticipantIssue,
  } = useParticipantEditorModel();

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
      setParticipantIssue(participantId);
      return;
    }

    const result = updateParticipantName(participantId, nextName);

    if (!result.ok) {
      const message = result.error ?? "Unable to update participant.";
      setError(message);
      setParticipantIssue(participantId, message);
      return;
    }

    updateParticipantDraft(participantId, normalizedNextName);
    setError(null);
    setParticipantIssue(participantId);
  }

  function handleRemoveParticipant(participantId: string) {
    const result = removeParticipant(participantId);

    if (!result.ok) {
      setError(result.error ?? "Unable to remove participant.");
      return;
    }

    setError(null);
    setParticipantIssue(participantId);
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
      <CardHeader className="p-3 pb-2 sm:p-5 sm:pb-3">
        <CardTitle>Participants</CardTitle>
        <CardDescription>Add people and choose the payer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0 sm:space-y-4 sm:p-5 sm:pt-0">
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
          <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-3 text-sm text-muted-foreground sm:p-4">
            Add someone to start. First person is payer.
          </div>
        ) : (
          <RadioGroup
            aria-label="Payer"
            value={draft.payerId ?? undefined}
            onValueChange={(value) => handleSetPayer(String(value))}
          >
            <div className="space-y-2">
              {draft.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border/80 bg-background/70 p-2.5 sm:p-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end"
                >
                  <div className="min-w-0">
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
                        setParticipantIssue(participant.id);
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
                    <label className="inline-flex h-11 w-full items-center gap-2 rounded-md border border-border bg-card px-2.5 text-sm sm:h-9 sm:px-3 md:w-auto">
                      <RadioGroupItem value={participant.id} id={`payer-${participant.id}`} />
                      <span>Payer</span>
                    </label>
                  </div>
                  <div className="col-span-2 flex justify-end md:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 min-h-8 px-2 text-muted-foreground hover:text-foreground md:h-9 md:min-h-9 md:w-auto md:px-3"
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
