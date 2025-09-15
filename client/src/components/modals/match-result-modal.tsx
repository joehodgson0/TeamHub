import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Event, Player } from "@shared/schema";

const matchResultSchema = z.object({
  homeTeamGoals: z.number().min(0, "Goals must be 0 or more").max(50, "Goals must be 50 or less"),
  awayTeamGoals: z.number().min(0, "Goals must be 0 or more").max(50, "Goals must be 50 or less"),
  playerStats: z.record(z.object({
    goals: z.number().min(0).max(50),
    assists: z.number().min(0).max(50)
  }))
});

type MatchResultFormData = z.infer<typeof matchResultSchema>;

interface MatchResultModalProps {
  fixture: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MatchResultModal({ fixture, open, onOpenChange }: MatchResultModalProps) {
  const { toast } = useToast();
  const [playerStats, setPlayerStats] = useState<Record<string, { goals: number; assists: number }>>({});

  const form = useForm<MatchResultFormData>({
    resolver: zodResolver(matchResultSchema),
    defaultValues: {
      homeTeamGoals: 0,
      awayTeamGoals: 0,
      playerStats: {}
    }
  });

  // Get team players
  const { data: playersResponse } = useQuery<{ players: Player[] }>({
    queryKey: ['/api/players/team', fixture?.teamId],
    enabled: !!fixture?.teamId
  });

  // Get existing match result
  const { data: existingResult } = useQuery<{ matchResult: any }>({
    queryKey: ['/api/match-results/fixture', fixture?.id],
    enabled: !!fixture?.id
  });

  // Reset form when fixture changes
  useEffect(() => {
    if (fixture && open) {
      const defaultStats: Record<string, { goals: number; assists: number }> = {};
      playersResponse?.players?.forEach((player: Player) => {
        defaultStats[player.id] = { goals: 0, assists: 0 };
      });

      if (existingResult?.matchResult) {
        const result = existingResult.matchResult;
        form.reset({
          homeTeamGoals: result.homeTeamGoals,
          awayTeamGoals: result.awayTeamGoals,
          playerStats: result.playerStats || {}
        });
        setPlayerStats(result.playerStats || defaultStats);
      } else {
        form.reset({
          homeTeamGoals: 0,
          awayTeamGoals: 0,
          playerStats: defaultStats
        });
        setPlayerStats(defaultStats);
      }
    }
  }, [fixture, playersResponse, existingResult, form, open]);

  const createMatchResultMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/match-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      // Invalidate specific cache keys as recommended by architect
      queryClient.invalidateQueries({ queryKey: ['/api/match-results/fixture', fixture?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/match-results/team', fixture?.teamId] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', fixture?.teamId] });
      queryClient.invalidateQueries({ queryKey: ['/api/match-results'] });
      toast({
        title: "Match Result Saved",
        description: "The match result has been saved successfully."
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save match result"
      });
    }
  });

  const updatePlayerStat = (playerId: string, field: 'goals' | 'assists', value: number) => {
    const newStats = {
      ...playerStats,
      [playerId]: {
        ...playerStats[playerId],
        [field]: Math.max(0, value)
      }
    };
    setPlayerStats(newStats);
    form.setValue('playerStats', newStats);
  };

  const calculateResult = (homeGoals: number, awayGoals: number, isHome: boolean): string => {
    if (homeGoals > awayGoals) {
      return isHome ? "win" : "lose";
    } else if (homeGoals < awayGoals) {
      return isHome ? "lose" : "win";
    } else {
      return "draw";
    }
  };

  const validatePlayerGoals = (homeGoals: number, awayGoals: number): boolean => {
    if (!fixture) return false;
    
    const isHome = fixture.homeAway === "home";
    const teamGoals = isHome ? homeGoals : awayGoals;
    const totalPlayerGoals = Object.values(playerStats).reduce((sum, stats) => sum + stats.goals, 0);
    
    return totalPlayerGoals <= teamGoals;
  };

  const onSubmit = (data: MatchResultFormData) => {
    if (!fixture) return;

    // Validate player goals don't exceed team total
    if (!validatePlayerGoals(data.homeTeamGoals, data.awayTeamGoals)) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Player goals cannot exceed the team's total goals"
      });
      return;
    }

    // Filter out players with no stats
    const filteredPlayerStats = Object.fromEntries(
      Object.entries(data.playerStats).filter(([_, stats]) => stats.goals > 0 || stats.assists > 0)
    );

    // Submit only the fields that the server expects
    // Server will compute isHomeFixture and result based on fixture data
    createMatchResultMutation.mutate({
      fixtureId: fixture.id,
      teamId: fixture.teamId,
      homeTeamGoals: data.homeTeamGoals,
      awayTeamGoals: data.awayTeamGoals,
      playerStats: filteredPlayerStats
    });
  };

  if (!fixture) return null;

  const isHome = fixture.homeAway === "home";
  const homeGoals = form.watch("homeTeamGoals");
  const awayGoals = form.watch("awayTeamGoals");
  const teamGoals = isHome ? homeGoals : awayGoals;
  const totalPlayerGoals = Object.values(playerStats).reduce((sum, stats) => sum + stats.goals, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-match-result">
        <DialogHeader>
          <DialogTitle>Update Match Result</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Match Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{fixture.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Opponent:</span>
                <span className="font-medium">{fixture.opponent}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Venue:</span>
                <Badge variant={isHome ? "default" : "secondary"}>
                  {isHome ? "Home" : "Away"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Score Entry */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Match Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="homeGoals">
                      Home Team Goals {isHome && "(Your Team)"}
                    </Label>
                    <Input
                      id="homeGoals"
                      type="number"
                      min="0"
                      max="50"
                      {...form.register("homeTeamGoals", { valueAsNumber: true })}
                      data-testid="input-home-goals"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="awayGoals">
                      Away Team Goals {!isHome && "(Your Team)"}
                    </Label>
                    <Input
                      id="awayGoals"
                      type="number"
                      min="0"
                      max="50"
                      {...form.register("awayTeamGoals", { valueAsNumber: true })}
                      data-testid="input-away-goals"
                    />
                  </div>
                </div>

                {/* Result Display */}
                {(homeGoals > 0 || awayGoals > 0) && (
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Result: </span>
                    <Badge className={`ml-2 ${
                      calculateResult(homeGoals, awayGoals, isHome) === "win" 
                        ? "bg-green-500" 
                        : calculateResult(homeGoals, awayGoals, isHome) === "lose"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`}>
                      {calculateResult(homeGoals, awayGoals, isHome).toUpperCase()}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Player Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Player Statistics</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Team Goals: {teamGoals} | Player Goals Total: {totalPlayerGoals}
                  {totalPlayerGoals > teamGoals && (
                    <span className="text-red-500 ml-2">⚠️ Player goals exceed team total!</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!playersResponse?.players ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <span className="text-sm">Loading players...</span>
                    </div>
                  ) : playersResponse?.players?.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <span className="text-sm">No players found on this team.</span>
                      <p className="text-xs mt-1">Add players to the team to track individual statistics.</p>
                    </div>
                  ) : (
                    playersResponse?.players?.map((player: Player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium" data-testid={`player-${player.id}-name`}>
                        {player.name}
                      </span>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`goals-${player.id}`} className="text-sm">Goals:</Label>
                          <Input
                            id={`goals-${player.id}`}
                            type="number"
                            min="0"
                            max="20"
                            className="w-16 h-8"
                            value={playerStats[player.id]?.goals || 0}
                            onChange={(e) => updatePlayerStat(player.id, 'goals', parseInt(e.target.value) || 0)}
                            data-testid={`input-goals-${player.id}`}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`assists-${player.id}`} className="text-sm">Assists:</Label>
                          <Input
                            id={`assists-${player.id}`}
                            type="number"
                            min="0"
                            max="20"
                            className="w-16 h-8"
                            value={playerStats[player.id]?.assists || 0}
                            onChange={(e) => updatePlayerStat(player.id, 'assists', parseInt(e.target.value) || 0)}
                            data-testid={`input-assists-${player.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createMatchResultMutation.isPending || totalPlayerGoals > teamGoals}
                data-testid="button-save-result"
              >
                {createMatchResultMutation.isPending ? "Saving..." : "Save Result"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}