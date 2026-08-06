import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import DependentDetailsModal from "@/components/modals/dependent-details-modal";
import { useState } from "react";

/**
 * Page shown to newly registered parents so they can add their first dependent.
 * After successful submission (or if they skip), they are taken to the dashboard.
 */
export default function AddDependent() {
  const [, setLocation] = useLocation();
  const [modalOpen, setModalOpen] = useState(true);

  const handleSuccess = () => {
    setLocation("/");
  };

  const handleSkip = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader className="text-center space-y-2">
            <Users className="w-12 h-12 text-primary mx-auto" />
            <CardTitle className="text-2xl">Add Your First Dependent</CardTitle>
            <CardDescription>
              As a parent/guardian you can register your child's details now. You'll need the team code from your team manager.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => setModalOpen(true)}>
              Fill in Dependent Details
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleSkip}>
              Skip for now – I'll add details later from My Dependents
            </Button>
          </CardContent>
        </Card>
      </div>

      <DependentDetailsModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          // If they close the modal without submitting, stay on the page so they can re-open it
        }}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
