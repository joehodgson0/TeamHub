import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Plus } from "lucide-react";
import CreateClubModal from "@/components/modals/create-club-modal";
import type { Club } from "@shared/schema";

export default function Club() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading } = useQuery<{ success: boolean; clubs: Club[] }>({
    queryKey: ["/api/clubs"],
    retry: false,
  });

  const clubs = data?.clubs ?? [];

  return (
    <div className="space-y-6" data-testid="club-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="heading-club">Club Admin</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Club
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading clubs...</div>
      ) : clubs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Building className="w-12 h-12 mx-auto text-muted-foreground opacity-40" />
            <p className="text-muted-foreground">No clubs yet. Create the first one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {clubs.map((club) => (
            <Card key={club.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{club.name}</span>
                  <Badge variant="secondary" className="font-mono tracking-wider">{club.code}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex gap-6">
                {club.established && <span>Est. {club.established}</span>}
                <span>{club.totalTeams} team{club.totalTeams !== 1 ? "s" : ""}</span>
                <span>{club.totalPlayers} player{club.totalPlayers !== 1 ? "s" : ""}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateClubModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
}

