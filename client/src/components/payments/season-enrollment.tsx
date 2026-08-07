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
import { format } from "date-fns";

interface ChildEnrollmentStatus {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  enrolled: boolean;
}

interface InstallmentPreviewItem {
  installmentNumber: number;
  amount: number;
  dueDate: string;
}

interface EnrollmentPreview {
  success: boolean;
  feeType: string;
  totalAmount: number;
  installments: InstallmentPreviewItem[];
  error?: string;
}

function ChildEnrollmentCard({ child, season }: { child: ChildEnrollmentStatus; season: string }) {
  const { toast } = useToast();
  const [paymentOption, setPaymentOption] = useState<"full" | "installments">("installments");

  const { data: preview, isFetching: previewLoading } = useQuery<EnrollmentPreview>({
    queryKey: [`/api/fees/enrollment-preview?playerId=${child.playerId}&season=${encodeURIComponent(season)}&paymentOption=${paymentOption}`],
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/fees/enroll", { playerId: child.playerId, season, paymentOption });
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

  const installments = preview?.installments || [];

  return (
    <Card data-testid={`enrollment-card-${child.playerId}`}>
      <CardHeader>
        <CardTitle className="text-base">Choose a payment plan for {child.playerName}</CardTitle>
        <CardDescription>{season} season fees for {child.teamName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={paymentOption}
          onValueChange={(value) => setPaymentOption(value as "full" | "installments")}
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

        <div className="rounded-md border p-3 bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground mb-2">Payment schedule</p>
          {previewLoading ? (
            <div className="flex items-center py-2">
              <Loader2 className="h-4 w-4 mr-2 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Calculating...</span>
            </div>
          ) : !preview?.success ? (
            <p className="text-xs text-destructive">{preview?.error || "No fee schedule configured for this season yet."}</p>
          ) : (
            <div className="space-y-1">
              {installments.map((item) => (
                <div key={item.installmentNumber} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {paymentOption === "full" ? "Full payment" : `Payment ${item.installmentNumber}`} •{" "}
                    {format(new Date(item.dueDate), "d MMM yyyy")}
                  </span>
                  <span className="font-medium">£{(item.amount / 100).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs pt-2 border-t mt-2 font-semibold">
                <span>Total</span>
                <span>£{(preview.totalAmount / 100).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <Button
          size="sm"
          onClick={() => enrollMutation.mutate()}
          disabled={enrollMutation.isPending || !preview?.success}
          data-testid={`button-enroll-${child.playerId}`}
        >
          {enrollMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Confirm Plan
        </Button>
      </CardContent>
    </Card>
  );
}

/** Parent-facing: choose a season payment plan (full/installments) for any child not yet enrolled. */
export default function SeasonEnrollment() {
  const season = getCurrentSeason();

  const { data, isLoading } = useQuery<{ success: boolean; players: ChildEnrollmentStatus[] }>({
    queryKey: [`/api/fees/my-enrollments?season=${encodeURIComponent(season)}`],
  });

  const unenrolled = (data?.players || []).filter((p) => !p.enrolled);

  if (isLoading || unenrolled.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="season-enrollment">
      {unenrolled.map((child) => (
        <ChildEnrollmentCard key={child.playerId} child={child} season={season} />
      ))}
    </div>
  );
}

