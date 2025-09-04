import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useStorage } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import CreateTeamModal from "@/components/modals/create-team-modal";
import TeamJoinSection from "@/components/team/team-join-section";
import TeamManagementSection from "@/components/team/team-management-section";

export default function Team() {
  const { user, hasRole } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canCreateTeam = hasRole("coach") && user?.clubId;

  return (
    <div className="space-y-6" data-testid="team-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="heading-team">Team Management</h1>
        {canCreateTeam && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
            data-testid="button-create-team"
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamManagementSection />
        <TeamJoinSection />
      </div>

      <CreateTeamModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}
