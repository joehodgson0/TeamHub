import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, MessageCircle, User, Bus } from "lucide-react";
import { format } from "date-fns";

export default function PostsList() {
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

  const getPosts = () => {
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

    return posts;
  };

  const posts = getPosts();

  const getPostTypeInfo = (type: string) => {
    switch (type) {
      case "kit_request":
        return { label: "Kit Request", color: "bg-accent/10 text-accent" };
      case "player_request":
        return { label: "Player Request", color: "bg-primary/10 text-primary" };
      case "announcement":
        return { label: "Announcement", color: "bg-secondary/10 text-secondary" };
      case "event":
        return { label: "Event", color: "bg-green-100 text-green-700" };
      default:
        return { label: type, color: "bg-muted text-muted-foreground" };
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
    <div className="space-y-4" data-testid="posts-list">
      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Posts Yet</p>
              <p className="text-sm">Posts and announcements will appear here</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => {
          const typeInfo = getPostTypeInfo(post.type);
          // Team info would be fetched if needed

          return (
            <Card key={post.id} data-testid={`post-${post.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {post.authorRole.includes("Manager") ? (
                          <User className="w-5 h-5" />
                        ) : (
                          <Bus className="w-5 h-5" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium" data-testid={`post-author-${post.id}`}>
                        {post.authorName}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span data-testid={`post-timestamp-${post.id}`}>
                          {formatPostTime(post.createdAt)}
                        </span>
                        <span>•</span>
                        <span data-testid={`post-author-role-${post.id}`}>
                          {post.authorRole}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge className={typeInfo.color} data-testid={`post-type-${post.id}`}>
                    {typeInfo.label}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold" data-testid={`post-title-${post.id}`}>
                    {post.title}
                  </h4>
                  <p className="text-muted-foreground" data-testid={`post-content-${post.id}`}>
                    {post.content}
                  </p>
                  
                  <div className="flex items-center space-x-4 pt-3 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      data-testid={`button-like-${post.id}`}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      <span>3 Helpful</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      data-testid={`button-reply-${post.id}`}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span>Reply</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
