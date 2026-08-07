import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getSeasonOptions, getCurrentSeason } from "@/lib/season";
import { CheckCircle2, AlertTriangle, Loader2, Mail, RefreshCw } from "lucide-react";

interface OverviewRow {
  enrollmentId: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  feeType: string;
  paymentOption: string;
  totalAmount: number;
  amountPaid: number;
  upToDate: boolean;
  overdueCount: number;
}

export default function SeasonOverview() {
  const { toast } = useToast();
  const seasonOptions = getSeasonOptions(6);
  const [season, setSeason] = useState(getCurrentSeason());

  const { data, isLoading } = useQuery<{ success: boolean; overview: OverviewRow[] }>({
    queryKey: [`/api/fee-schedules/${season}/overview`],
  });

  const rows = data?.overview || [];

  const sweepMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/fees/reminders/run-now", {});
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Reminder sweep complete",
          description: `${result.remindersSent} reminder(s) sent, ${result.markedOverdue} marked overdue.`,
        });
        queryClient.invalidateQueries({ queryKey: [`/api/fee-schedules/${season}/overview`] });
      }
    },
  });

  return (
    <Card data-testid="card-season-overview">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team & Player Status</CardTitle>
            <CardDescription>Up-to-date status for every enrolled player this season</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sweepMutation.mutate()}
            disabled={sweepMutation.isPending}
            data-testid="button-run-reminder-sweep"
          >
            {sweepMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Check overdue & send reminders
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-xs space-y-2">
          <Select value={season} onValueChange={setSeason}>
            <SelectTrigger data-testid="select-overview-season">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {seasonOptions.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No players enrolled for {season} yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.enrollmentId}
                className="flex items-center justify-between p-3 rounded-lg border"
                data-testid={`overview-row-${row.playerId}`}
              >
                <div>
                  <p className="font-medium text-sm">{row.playerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.teamName} • {row.feeType.replace("_", " ")} • {row.paymentOption} •{" "}
                    £{(row.amountPaid / 100).toFixed(2)} / £{(row.totalAmount / 100).toFixed(2)} paid
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {row.upToDate ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Up to date
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {row.overdueCount > 0 ? `${row.overdueCount} overdue` : "Payment due"}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
