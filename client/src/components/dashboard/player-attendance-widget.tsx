import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";

export default function PlayerAttendanceWidget() {
  const { user } = useAuth();

  // TODO: Replace with API call to fetch player attendance data
  const getPlayerAttendance = () => {
    if (!user) return [];
    
    // Return empty array for now - will be replaced with API call
    return [];
  };

  const playerAttendance = getPlayerAttendance();

  return (
    <Card data-testid="widget-player-attendance">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserCheck className="w-5 h-5 text-primary" />
          <span>Player Attendance</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {playerAttendance.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No player data available</p>
            </div>
          ) : (
            playerAttendance.slice(0, 4).map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between"
                data-testid={`player-attendance-${player.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium" data-testid={`player-initials-${player.id}`}>
                      {player.initials}
                    </span>
                  </div>
                  <span className="text-sm font-medium" data-testid={`player-name-${player.id}`}>
                    {player.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground" data-testid={`player-rate-${player.id}`}>
                    {player.attendanceRate}%
                  </span>
                  <div className="w-12 h-2 bg-muted rounded-full">
                    <div 
                      className="h-2 bg-primary rounded-full"
                      style={{ width: `${player.attendanceRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
