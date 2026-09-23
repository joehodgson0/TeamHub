import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Player } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type GuardianSummary = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  primary: boolean;
};

interface ManageGuardiansDialogProps {
  player: Player | null;
  onOpenChange: (open: boolean) => void;
  duplicateCandidates?: Player[];
  onChanged?: () => void;
}

export default function ManageGuardiansDialog({
  player,
  onOpenChange,
  duplicateCandidates = [],
  onChanged,
}: ManageGuardiansDialogProps) {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { data, isLoading } = useQuery<{ success: boolean; guardians: GuardianSummary[] }>({
    queryKey: ["/api/players", player?.id, "guardians"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/players/${player!.id}/guardians`);
      return response.json();
    },
    enabled: Boolean(player?.id),
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/players/parent"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/players/team"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/players", player?.id, "guardians"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/teams/club"] }),
    ]);
    onChanged?.();
  };

  const linkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/players/${player!.id}/guardians`, { email });
      return response.json();
    },
    onSuccess: async () => {
      setEmail("");
      await invalidate();
      toast({ title: "Parent linked", description: "They can now access this dependant from their own account." });
    },
    onError: (error: Error) => toast({
      variant: "destructive",
      title: "Unable to link parent",
      description: error.message.replace(/^\d+:\s*/, ""),
    }),
  });

  const mergeMutation = useMutation({
    mutationFn: async (duplicatePlayerId: string) => {
      const response = await apiRequest("POST", `/api/players/${player!.id}/merge-duplicate`, { duplicatePlayerId });
      return response.json();
    },
    onSuccess: async () => {
      await invalidate();
      toast({ title: "Duplicate merged", description: "Parents and activity were moved to the remaining dependant record." });
      onOpenChange(false);
    },
    onError: (error: Error) => toast({
      variant: "destructive",
      title: "Unable to merge duplicate",
      description: error.message.replace(/^\d+:\s*/, ""),
    }),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (email.trim()) linkMutation.mutate();
  };

  return (
    <Dialog open={Boolean(player)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Parents and guardians</DialogTitle>
          <DialogDescription>
            Link another registered TeamHub parent to {player?.name}. This shares the existing record instead of creating another player.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Currently linked</p>
            {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : data?.guardians.map((guardian) => (
              <div key={guardian.id} className="flex items-center justify-between rounded border p-2 text-sm">
                <span>{[guardian.firstName, guardian.lastName].filter(Boolean).join(" ") || guardian.email}</span>
                {guardian.primary && <Badge variant="secondary">Primary contact</Badge>}
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-2">
            <label htmlFor="guardian-email" className="text-sm font-medium">Add registered parent by email</label>
            <div className="flex gap-2">
              <Input
                id="guardian-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="parent@example.com"
                required
              />
              <Button type="submit" disabled={linkMutation.isPending || !email.trim()}>
                {linkMutation.isPending ? "Linking…" : "Link"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">The other parent must register and select the Parent role first.</p>
          </form>

          {duplicateCandidates.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">Possible duplicate records</p>
              <p className="text-xs text-muted-foreground">Merging keeps this record and removes the duplicate. Records with fees require administrator review.</p>
              {duplicateCandidates.map((duplicate) => (
                <div key={duplicate.id} className="flex items-center justify-between rounded border border-amber-300 p-2 text-sm">
                  <span>{duplicate.name} · {new Date(duplicate.dateOfBirth).toLocaleDateString()}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={mergeMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Merge the duplicate ${duplicate.name} record into this one?`)) {
                        mergeMutation.mutate(duplicate.id);
                      }
                    }}
                  >
                    Merge duplicate
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
