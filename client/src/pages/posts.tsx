import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreatePostModal from "@/components/modals/create-post-modal";
import PostsList from "@/components/posts/posts-list";
import PostCategories from "@/components/posts/post-categories";

export default function Posts() {
  const { hasRole } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canCreatePost = hasRole("coach");

  return (
    <div className="space-y-6" data-testid="posts-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="heading-posts">Posts & Announcements</h1>
        {canCreatePost && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
            data-testid="button-create-post"
          >
            <Plus className="w-4 h-4" />
            <span>Create Post</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <PostsList />
        </div>
        <div>
          <PostCategories />
        </div>
      </div>

      <CreatePostModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}
