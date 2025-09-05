import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { User, Bus, FileText, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import EditPostModal from "@/components/modals/edit-post-modal";
import type { Post } from "@shared/schema";

export default function PostsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

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

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts/team'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts/club'] });
      toast({
        title: "Post Deleted",
        description: "The post has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete post. Please try again.",
      });
    },
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

  const handleEditPost = (post: Post) => {
    setSelectedPost(post);
    setShowEditModal(true);
  };

  const handleDeletePost = (post: Post) => {
    setPostToDelete(post);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (postToDelete) {
      deletePostMutation.mutate(postToDelete.id);
      setShowDeleteDialog(false);
      setPostToDelete(null);
    }
  };

  return (
    <div className="space-y-4" data-testid="posts-list">
      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
                  <div className="flex items-center space-x-2">
                    <Badge className={typeInfo.color} data-testid={`post-type-${post.id}`}>
                      {typeInfo.label}
                    </Badge>
                    {user && post.authorId === user.id && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPost(post)}
                          data-testid={`button-edit-${post.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePost(post)}
                          data-testid={`button-delete-${post.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold" data-testid={`post-title-${post.id}`}>
                    {post.title}
                  </h4>
                  <p className="text-muted-foreground" data-testid={`post-content-${post.id}`}>
                    {post.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Edit Post Modal */}
      {selectedPost && (
        <EditPostModal
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open);
            if (!open) setSelectedPost(null);
          }}
          post={selectedPost}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="dialog-delete-post">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deletePostMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deletePostMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
