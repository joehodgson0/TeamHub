import { useAuth } from "@/hooks/use-auth";
import { useStorage } from "@/hooks/use-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Medal, Star, Trophy } from "lucide-react";

export default function TeamAwardsWidget() {
  const { user } = useAuth();
  const { storage } = useStorage();

  const getTeamAwards = () => {
    if (!user) return [];

    let awards: any[] = [];

    if (user.roles.includes("coach")) {
      const userTeams = storage.getTeamsByManagerId(user.id);
      const teamIds = userTeams.map(team => team.id);
      awards = teamIds.flatMap(teamId => storage.getAwardsByTeamId(teamId));
    } else if (user.roles.includes("parent")) {
      const userPlayers = storage.getPlayersByParentId(user.id);
      const teamIds = Array.from(new Set(userPlayers.map(player => player.teamId)));
      awards = teamIds.flatMap(teamId => storage.getAwardsByTeamId(teamId));
    }

    return awards.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 3);
  };

  const teamAwards = getTeamAwards();

  const getAwardIcon = (title: string) => {
    if (title.toLowerCase().includes("player of the month")) {
      return <Star className="text-white text-sm" />;
    }
    if (title.toLowerCase().includes("attendance")) {
      return <Trophy className="text-white text-sm" />;
    }
    return <Medal className="text-white text-sm" />;
  };

  const getAwardColors = (title: string) => {
    if (title.toLowerCase().includes("player of the month")) {
      return {
        background: "bg-gradient-to-r from-yellow-50 to-orange-50",
        border: "border-yellow-200",
        icon: "bg-yellow-500"
      };
    }
    if (title.toLowerCase().includes("attendance")) {
      return {
        background: "bg-gradient-to-r from-green-50 to-emerald-50",
        border: "border-green-200",
        icon: "bg-green-500"
      };
    }
    return {
      background: "bg-gradient-to-r from-blue-50 to-indigo-50",
      border: "border-blue-200",
      icon: "bg-blue-500"
    };
  };

  return (
    <Card data-testid="widget-team-awards">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Medal className="w-5 h-5 text-primary" />
          <span>Team Awards</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {teamAwards.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Medal className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No awards yet</p>
            </div>
          ) : (
            teamAwards.map((award) => {
              const colors = getAwardColors(award.title);
              return (
                <div
                  key={award.id}
                  className={`flex items-center space-x-3 p-3 rounded-md border ${colors.background} ${colors.border}`}
                  data-testid={`award-${award.id}`}
                >
                  <div className={`w-10 h-10 ${colors.icon} rounded-full flex items-center justify-center`}>
                    {getAwardIcon(award.title)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm" data-testid={`award-title-${award.id}`}>
                      {award.title}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`award-recipient-${award.id}`}>
                      {award.recipient} • {award.month} {award.year}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
