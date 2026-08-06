import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface Fee {
  id: string;
  name: string;
  amount: number;
}

interface Team {
  id: string;
  name: string;
  ageGroup: string;
  playerIds: string[];
}

interface AssignFeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fee: Fee;
  onSuccess: () => void;
}

export default function AssignFeeModal({ open, onOpenChange, fee, onSuccess }: AssignFeeModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  // Fetch teams for the club
  const { data: teamsResponse, isLoading: isLoadingTeams } = useQuery<{ success: boolean; teams: Team[] }>({
    queryKey: ["/api/teams/club", user?.clubId],
    enabled: !!user?.clubId && open,
  });

  const teams = teamsResponse?.teams || [];

  // Calculate total players that will be assigned
  const totalPlayersToAssign = teams
    .filter(team => selectedTeamIds.includes(team.id))
    .reduce((sum, team) => sum + (team.playerIds?.length || 0), 0);

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/fees/${fee.id}/assign`, { teamIds: selectedTeamIds });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Fee assigned",
        description: `Fee assigned to ${data.assignmentsCreated} player(s).`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
      queryClient.invalidateQueries({ queryKey: [`/api/fees/${fee.id}/assignments`] });
      setSelectedTeamIds([]);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign fee",
        variant: "destructive",
      });
    },
  });

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeamIds(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTeamIds.length === teams.length) {
      setSelectedTeamIds([]);
    } else {
      setSelectedTeamIds(teams.map(t => t.id));
    }
  };

  const handleAssign = () => {
    if (selectedTeamIds.length === 0) {
      toast({
        title: "No teams selected",
        description: "Please select at least one team to assign the fee to.",
        variant: "destructive",
      });
      return;
    }
    assignMutation.mutate();
  };

  const formatAmount = (amount: number) => {
    return `£${(amount / 100).toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Fee to Players</DialogTitle>
          <DialogDescription>
            Select teams to assign "{fee.name}" ({formatAmount(fee.amount)}) to all their players.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedTeamIds.length === teams.length && teams.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="font-medium">
                Select All Teams
              </Label>
            </div>
            {selectedTeamIds.length > 0 && (
              <Badge variant="secondary">
                {selectedTeamIds.length} team(s) selected
              </Badge>
            )}
          </div>

          <Separator />

          {/* Team List */}
          <ScrollArea className="h-[300px] pr-4">
            {isLoadingTeams ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading teams...</p>
              </div>
            ) : teams.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No teams found in your club.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTeamIds.includes(team.id)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleTeamToggle(team.id)}
                  >
                    <Checkbox
                      checked={selectedTeamIds.includes(team.id)}
                      onCheckedChange={() => handleTeamToggle(team.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{team.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {team.ageGroup} • {team.playerIds?.length || 0} players
                      </div>
                    </div>
                    {selectedTeamIds.includes(team.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Summary */}
          {totalPlayersToAssign > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total players to assign:
                </span>
                <span className="font-medium">{totalPlayersToAssign}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total amount:
                </span>
                <span className="font-medium">
                  {formatAmount(fee.amount * totalPlayersToAssign)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={assignMutation.isPending || selectedTeamIds.length === 0}
          >
            {assignMutation.isPending ? "Assigning..." : `Assign to ${totalPlayersToAssign} Players`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
