import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import UpcomingEventsWidget from "@/components/dashboard/upcoming-events-widget";
import TeamStatsWidget from "@/components/dashboard/team-stats-widget";
import PlayerAttendanceWidget from "@/components/dashboard/player-attendance-widget";
import MatchResultsWidget from "@/components/dashboard/match-results-widget";
import TeamPostsWidget from "@/components/dashboard/team-posts-widget";
import TeamAwardsWidget from "@/components/dashboard/team-awards-widget";

export default function Dashboard() {
  const handleQuickActions = () => {
    // TODO: Show quick actions modal or dropdown
    console.log("Quick actions clicked");
  };

  return (
    <div className="space-y-6" data-testid="dashboard">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="heading-dashboard">Dashboard</h1>
        <Button
          onClick={handleQuickActions}
          className="flex items-center space-x-2"
          data-testid="button-quick-actions"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Actions</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UpcomingEventsWidget />
        <TeamStatsWidget />
        <PlayerAttendanceWidget />
        <MatchResultsWidget />
        <TeamPostsWidget />
        <TeamAwardsWidget />
      </div>
    </div>
  );
}
