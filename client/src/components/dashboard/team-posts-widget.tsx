import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";
import { format } from "date-fns";

export default function TeamPostsWidget() {
  const { user } = useAuth();

  // Fetch posts
  const { data: postsResponse } = useQuery<{ success: boolean; posts: any[] }>({
    queryKey: ['/api/posts'],
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

  const getTeamPosts = () => {
    if (!user || !postsResponse?.posts) return [];

    let posts = postsResponse.posts
      .map(post => ({ ...post, createdAt: new Date(post.createdAt) }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Filter posts based on user's teams and club
    if (user.clubId) {
      posts = posts.filter(post => {
        // Show club-wide posts
        if (post.clubId === user.clubId) return true;
        
        // Show team-specific posts for user's teams
        if (post.teamId) {
          if (user.roles.includes("coach") && teamsResponse?.teams) {
            return teamsResponse.teams.some(team => team.id === post.teamId);
          } else if (user.roles.includes("parent") && playersResponse?.players) {
            return playersResponse.players.some(player => player.teamId === post.teamId);
          }
        }
        
        return false;
      });
    }

    // Filter by post type based on user role
    if (user.roles.includes("parent") && !user.roles.includes("coach")) {
      // Parents only see announcements
      posts = posts.filter(post => post.type === "announcement");
    }
    // Coaches/managers see all post types (no additional filtering)

    return posts.slice(0, 3);
  };

  const teamPosts = getTeamPosts();

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "kit_request": return "border-primary";
      case "player_request": return "border-secondary";
      case "announcement": return "border-accent";
      case "event": return "border-green-500";
      default: return "border-muted";
    }
  };

  const formatPostTime = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return format(date, "MMM d");
  };

  return (
    <Card data-testid="widget-team-posts">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Megaphone className="w-5 h-5 text-primary" />
          <span>Team Posts</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {teamPosts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent posts</p>
            </div>
          ) : (
            teamPosts.map((post) => (
              <div
                key={post.id}
                className={`border-l-4 pl-3 py-2 ${getPostTypeColor(post.type)}`}
                data-testid={`post-${post.id}`}
              >
                <p className="text-sm font-medium" data-testid={`post-title-${post.id}`}>
                  {post.title}
                </p>
                <p className="text-xs text-muted-foreground" data-testid={`post-excerpt-${post.id}`}>
                  {post.content.slice(0, 60)}...
                </p>
                <p className="text-xs text-muted-foreground mt-1" data-testid={`post-author-${post.id}`}>
                  By {post.authorName} • {formatPostTime(post.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
