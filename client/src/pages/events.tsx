import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import CreateFixtureModal from "@/components/modals/create-fixture-modal";
import ClubCalendar from "@/components/events/club-calendar";
import TeamCalendar from "@/components/events/team-calendar";

export default function Events() {
  const { hasRole } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canCreateFixture = hasRole("coach");

  return (
    <div className="space-y-6" data-testid="events-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="heading-events">Events & Fixtures</h1>
        {canCreateFixture && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
            data-testid="button-add-event"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClubCalendar />
        <TeamCalendar />
      </div>

      <CreateFixtureModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}
