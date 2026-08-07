import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCurrentSeason } from "@/lib/season";
import { Loader2 } from "lucide-react";

interface ChildEnrollmentStatus {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  enrolled: boolean;
}

/** Parent-facing: choose a season payment plan (full/installments) for any child not yet enrolled. */
export default function SeasonEnrollment() {
  const { toast } = useToast();
  const season = getCurrentSeason();
  const [choices, setChoices] = useState<Record<string, "full" | "installments">>({});

  const { data, isLoading } = useQuery<{ success: boolean; players: ChildEnrollmentStatus[] }>({
    queryKey: [`/api/fees/my-enrollments?season=${encodeURIComponent(season)}`],
  });

  const unenrolled = (data?.players || []).filter((p) => !p.enrolled);

  const enrollMutation = useMutation({
    mutationFn: async ({ playerId, paymentOption }: { playerId: string; paymentOption: "full" | "installments" }) => {
      const res = await apiRequest("POST", "/api/fees/enroll", { playerId, season, paymentOption });
      return res.json();
    },
    onSuccess: (result: any) => {
      if (!result.success) {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to enroll" });
        return;
      }
      toast({ title: "Enrolled", description: "Payment plan set up successfully." });
      queryClient.invalidateQueries({ queryKey: [`/api/fees/my-enrollments?season=${encodeURIComponent(season)}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/fees/my-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/outstanding"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to enroll" });
    },
  });

  if (isLoading || unenrolled.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="season-enrollment">
      {unenrolled.map((child) => (
        <Card key={child.playerId} data-testid={`enrollment-card-${child.playerId}`}>
          <CardHeader>
            <CardTitle className="text-base">Choose a payment plan for {child.playerName}</CardTitle>
            <CardDescription>{season} season fees for {child.teamName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={choices[child.playerId] || "installments"}
              onValueChange={(value) => setChoices({ ...choices, [child.playerId]: value as "full" | "installments" })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id={`full-${child.playerId}`} />
                <Label htmlFor={`full-${child.playerId}`}>Pay in full now (10% discount)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="installments" id={`installments-${child.playerId}`} />
                <Label htmlFor={`installments-${child.playerId}`}>
                  Monthly installments (Sept-May, first payment doubled)
                </Label>
              </div>
            </RadioGroup>
            <Button
              size="sm"
              onClick={() =>
                enrollMutation.mutate({ playerId: child.playerId, paymentOption: choices[child.playerId] || "installments" })
              }
              disabled={enrollMutation.isPending}
              data-testid={`button-enroll-${child.playerId}`}
            >
              {enrollMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Plan
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
