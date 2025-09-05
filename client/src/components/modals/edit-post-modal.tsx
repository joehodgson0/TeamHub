import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPostSchema, type CreatePost, type Post } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface EditPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
}

const postTypes = [
  { value: "kit_request", label: "Kit Request", description: "Request equipment or kit items" },
  { value: "player_request", label: "Player Request", description: "Looking for new team members" },
  { value: "announcement", label: "Announcement", description: "General team or club announcements" },
];

export default function EditPostModal({ open, onOpenChange, post }: EditPostModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch user's teams
  const { data: teamsResponse } = useQuery<{ success: boolean; teams: any[] }>({
    queryKey: ['/api/teams/club', user?.clubId],
    enabled: !!user?.clubId,
  });
  
  // Fetch user's club
  const { data: clubResponse } = useQuery<{ success: boolean; club: any }>({
    queryKey: ['/api/clubs', user?.clubId],
    enabled: !!user?.clubId,
  });
  
  const userTeams = teamsResponse?.teams || [];
  const userClub = clubResponse?.club || null;

  const updatePostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
        credentials: 'include',
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts/team'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts/club'] });
    },
  });

  const form = useForm<CreatePost & { scope: "team" | "club" }>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      type: post.type as any,
      title: post.title,
      content: post.content,
      scope: post.teamId ? "team" : "club",
    },
  });

  // Reset form when post changes
  useEffect(() => {
    if (post) {
      form.reset({
        type: post.type as any,
        title: post.title,
        content: post.content,
        scope: post.teamId ? "team" : "club",
      });
    }
  }, [post, form]);

  const onSubmit = async (data: CreatePost & { scope: "team" | "club" }) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to update posts.",
      });
      return;
    }

    try {
      // Get manager's team automatically
      const managerTeam = userTeams.length > 0 ? userTeams[0] : null;
      
      const postData = {
        type: data.type,
        title: data.title,
        content: data.content,
        teamId: data.scope === "team" && managerTeam ? managerTeam.id : undefined,
        clubId: data.scope === "club" && user.clubId ? user.clubId : undefined,
      };

      await updatePostMutation.mutateAsync(postData);

      toast({
        title: "Post Updated Successfully",
        description: `Your ${postTypes.find(t => t.value === data.type)?.label.toLowerCase()} has been updated.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update post. Please try again.",
      });
    }
  };

  const selectedScope = form.watch("scope");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" data-testid="modal-edit-post">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-edit-post">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-post-type">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {postTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-post-scope">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="team">Team Only</SelectItem>
                        <SelectItem value="club">Entire Club</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter post title"
                      data-testid="input-post-title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter post content"
                      className="min-h-[120px]"
                      data-testid="textarea-post-content"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updatePostMutation.isPending}
                data-testid="button-update-post"
              >
                {updatePostMutation.isPending ? "Updating..." : "Update Post"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}