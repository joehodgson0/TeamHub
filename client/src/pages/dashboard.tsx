import UpcomingEventsWidget from "@/components/dashboard/upcoming-events-widget";
import UpcomingFixturesWidget from "@/components/dashboard/upcoming-fixtures-widget";
import TeamStatsWidget from "@/components/dashboard/team-stats-widget";
import PlayerAttendanceWidget from "@/components/dashboard/player-attendance-widget";
import MatchResultsWidget from "@/components/dashboard/match-results-widget";
import TeamPostsWidget from "@/components/dashboard/team-posts-widget";
import TeamAwardsWidget from "@/components/dashboard/team-awards-widget";

export default function Dashboard() {

  return (
    <div className="space-y-6" data-testid="dashboard">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="heading-dashboard">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UpcomingEventsWidget />
        <UpcomingFixturesWidget />
        <TeamStatsWidget />
        <PlayerAttendanceWidget />
        <MatchResultsWidget />
        <TeamPostsWidget />
        <TeamAwardsWidget />
      </div>
    </div>
  );
}
