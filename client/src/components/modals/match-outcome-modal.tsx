import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import { isUnplayedMatchOutcome } from "@shared/event-outcome";

type OutcomeStatus = "scheduled" | "cancelled" | "forfeit";
type ForfeitedSide = "team" | "opponent";

interface MatchOutcomeModalProps {
  fixture: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MatchOutcomeModal({ fixture, open, onOpenChange }: MatchOutcomeModalProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<OutcomeStatus>("scheduled");
  const [forfeitedSide, setForfeitedSide] = useState<ForfeitedSide>("team");

  useEffect(() => {
    if (!open || !fixture) return;
    setStatus(isUnplayedMatchOutcome(fixture.result) ? fixture.result.status : "scheduled");
    setForfeitedSide(
      isUnplayedMatchOutcome(fixture.result) && fixture.result.status === "forfeit"
        ? fixture.result.forfeitedSide
        : "team",
    );
  }, [fixture, open]);

  const updateOutcome = useMutation({
    mutationFn: async () => {
      if (!fixture) throw new Error("No match selected");
      const response = await apiRequest("PUT", `/api/events/${fixture.id}/outcome`, {
        status,
        ...(status === "forfeit" ? { forfeitedSide } : {}),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Failed to update match outcome");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/all-session"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/upcoming-session"] });
      queryClient.invalidateQueries({ queryKey: ["/api/match-results-session"] });
      toast({
        title: status === "scheduled" ? "Match restored" : status === "cancelled" ? "Match cancelled" : "Match marked as forfeited",
        description: status === "forfeit" ? "No score or team statistics were changed." : undefined,
      });
      onOpenChange(false);
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Could not update match", description: error.message }),
  });

  if (!fixture) return null;

  const options: { value: OutcomeStatus; label: string }[] = [
    { value: "scheduled", label: "Scheduled" },
    { value: "cancelled", label: "Cancelled" },
    { value: "forfeit", label: "Forfeited" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="modal-match-outcome">
        <DialogHeader>
          <DialogTitle>Match outcome</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {fixture.name || `Match${fixture.opponent ? ` vs ${fixture.opponent}` : ""}`}
          </p>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Match outcome">
            {options.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={status === option.value ? "default" : "outline"}
                aria-pressed={status === option.value}
                onClick={() => setStatus(option.value)}
                disabled={updateOutcome.isPending}
              >
                {option.label}
              </Button>
            ))}
          </div>
          {status === "forfeit" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Which side forfeited?</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={forfeitedSide === "team" ? "default" : "outline"}
                  aria-pressed={forfeitedSide === "team"}
                  onClick={() => setForfeitedSide("team")}
                  disabled={updateOutcome.isPending}
                >
                  Our team
                </Button>
                <Button
                  type="button"
                  variant={forfeitedSide === "opponent" ? "default" : "outline"}
                  aria-pressed={forfeitedSide === "opponent"}
                  onClick={() => setForfeitedSide("opponent")}
                  disabled={updateOutcome.isPending}
                >
                  Opponent
                </Button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Cancelled and forfeited matches stay in the fixture history. Forfeits do not add a score or change team statistics.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={updateOutcome.isPending}>
              Close
            </Button>
            <Button type="button" onClick={() => updateOutcome.mutate()} disabled={updateOutcome.isPending}>
              {updateOutcome.isPending ? "Saving..." : "Save outcome"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
