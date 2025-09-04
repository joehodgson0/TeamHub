import { useAuth } from "@/hooks/use-auth";
import { useStorage } from "@/hooks/use-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function EventsStats() {
  const { user } = useAuth();
  const { storage } = useStorage();

  const getStats = () => {
    if (!user) return { thisMonth: 0, averageAttendance: 0, pendingResults: 0 };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let fixtures = storage.getFixtures();

    // Filter by user's teams
    if (user.roles.includes("coach")) {
      const userTeams = storage.getTeamsByManagerId(user.id);
      const teamIds = userTeams.map(team => team.id);
      fixtures = fixtures.filter(fixture => teamIds.includes(fixture.teamId));
    } else if (user.roles.includes("parent")) {
      const userPlayers = storage.getPlayersByParentId(user.id);
      const teamIds = userPlayers.map(player => player.teamId);
      fixtures = fixtures.filter(fixture => teamIds.includes(fixture.teamId));
    }

    // This month's fixtures
    const thisMonthFixtures = fixtures.filter(
      fixture => fixture.startTime >= startOfMonth && fixture.startTime <= endOfMonth
    );

    // Average attendance calculation
    const fixturesWithAttendance = fixtures.filter(
      fixture => Object.keys(fixture.availability || {}).length > 0
    );
    
    let totalAttendanceRate = 0;
    if (fixturesWithAttendance.length > 0) {
      fixturesWithAttendance.forEach(fixture => {
        const availability = Object.values(fixture.availability || {});
        const confirmed = availability.filter(status => status === "available").length;
        const total = availability.length;
        if (total > 0) {
          totalAttendanceRate += (confirmed / total) * 100;
        }
      });
      totalAttendanceRate = Math.round(totalAttendanceRate / fixturesWithAttendance.length);
    }

    // Pending results (completed matches without results)
    const pendingResults = fixtures.filter(
      fixture => 
        fixture.type === "match" && 
        fixture.startTime < now && 
        !fixture.result
    ).length;

    return {
      thisMonth: thisMonthFixtures.length,
      averageAttendance: totalAttendanceRate,
      pendingResults,
    };
  };

  const stats = getStats();

  return (
    <Card data-testid="card-events-stats">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span>Quick Stats</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">This Month</span>
            <span className="font-medium" data-testid="stat-this-month">
              {stats.thisMonth} fixtures
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Average Attendance</span>
            <span className="font-medium" data-testid="stat-average-attendance">
              {stats.averageAttendance}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pending Results</span>
            <span className="font-medium" data-testid="stat-pending-results">
              {stats.pendingResults} matches
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
