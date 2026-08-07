import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Team } from "@shared/schema";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface PlayerStatus {
  playerId: string;
  playerName: string;
  upToDate: boolean;
  outstandingCount: number;
  overdueCount: number;
}

export default function TeamFeeStatus() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const { data: teamsData } = useQuery<{ success: boolean; teams: Team[] }>({
    queryKey: ["/api/teams/club", user?.clubId],
    enabled: !!user?.clubId,
  });

  const myTeams = (teamsData?.teams || []).filter((t) => user?.teamIds?.includes(t.id));

  useEffect(() => {
    if (!selectedTeamId && myTeams.length > 0) {
      setSelectedTeamId(myTeams[0].id);
    }
  }, [myTeams, selectedTeamId]);

  const { data, isLoading } = useQuery<{ success: boolean; team: Team; statuses: PlayerStatus[] }>({
    queryKey: [`/api/fees/team-status/${selectedTeamId}`],
    enabled: !!selectedTeamId,
  });

  const statuses = data?.statuses || [];

  if (myTeams.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          You aren't managing any teams yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-team-fee-status">
      <CardHeader>
        <CardTitle>Team Payment Status</CardTitle>
        <CardDescription>See which players on your team are up to date with fees</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-xs">
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger data-testid="select-team-fee-status">
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              {myTeams.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : statuses.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No players in this team yet.</p>
        ) : (
          <div className="space-y-2">
            {statuses.map((s) => (
              <div
                key={s.playerId}
                className="flex items-center justify-between p-3 rounded-lg border"
                data-testid={`team-status-row-${s.playerId}`}
              >
                <span className="font-medium text-sm">{s.playerName}</span>
                {s.upToDate ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Up to date
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {s.overdueCount > 0 ? `${s.overdueCount} overdue` : `${s.outstandingCount} due`}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
