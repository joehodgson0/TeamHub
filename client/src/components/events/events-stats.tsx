import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function EventsStats() {
  const { user } = useAuth();

  // Fetch events
  const { data: eventsResponse } = useQuery<{ success: boolean; events: any[] }>({
    queryKey: ['/api/events'],
    enabled: !!user,
  });
  
  // Fetch user's teams for filtering
  const { data: teamsResponse } = useQuery<{ success: boolean; teams: any[] }>({
    queryKey: ['/api/teams/club', user?.clubId],
    enabled: !!user?.clubId && user?.roles.includes('coach'),
  });
  
  // Fetch user's players for filtering
  const { data: playersResponse } = useQuery<{ success: boolean; players: any[] }>({
    queryKey: ['/api/players/parent', user?.id],
    enabled: !!user && user?.roles.includes('parent'),
  });

  const getStats = () => {
    if (!user || !eventsResponse?.events) return { thisMonth: 0, averageAttendance: 0, pendingResults: 0 };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let events = eventsResponse.events.map(event => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime)
    }));

    // Filter by user's teams
    if (user.roles.includes("coach") && teamsResponse?.teams) {
      const teamIds = teamsResponse.teams.map(team => team.id);
      events = events.filter(event => teamIds.includes(event.teamId));
    } else if (user.roles.includes("parent") && playersResponse?.players) {
      const teamIds = playersResponse.players.map(player => player.teamId);
      events = events.filter(event => teamIds.includes(event.teamId));
    }

    // This month's events
    const thisMonthEvents = events.filter(
      event => event.startTime >= startOfMonth && event.startTime <= endOfMonth
    );

    // Average attendance calculation
    const eventsWithAttendance = events.filter(
      event => Object.keys(event.availability || {}).length > 0
    );
    
    let totalAttendanceRate = 0;
    if (eventsWithAttendance.length > 0) {
      eventsWithAttendance.forEach(event => {
        const availability = Object.values(event.availability || {});
        const confirmed = availability.filter(status => status === "available").length;
        const total = availability.length;
        if (total > 0) {
          totalAttendanceRate += (confirmed / total) * 100;
        }
      });
      totalAttendanceRate = Math.round(totalAttendanceRate / eventsWithAttendance.length);
    }

    // Pending results (completed matches without results)
    const pendingResults = events.filter(
      event => 
        event.type === "match" && 
        event.startTime < now && 
        !event.result
    ).length;

    return {
      thisMonth: thisMonthEvents.length,
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
