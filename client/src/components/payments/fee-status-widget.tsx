import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, CreditCard, Loader2 } from "lucide-react";
import { format } from "date-fns";
import MockPaymentModal from "@/components/modals/mock-payment-modal";

interface NextPayment {
  feeAssignmentId: string;
  feeName: string;
  amount: number;
  dueDate: string;
  isOverdue: boolean;
}

interface ChildStatus {
  playerId: string;
  playerName: string;
  upToDate: boolean;
  nextPayment: NextPayment | null;
  outstandingCount: number;
}

/** Parent-facing widget: shows each child as up-to-date, or with their next payment due/overdue. */
export default function FeeStatusWidget() {
  const [payingFor, setPayingFor] = useState<NextPayment | null>(null);

  const { data, isLoading } = useQuery<{ success: boolean; statuses: ChildStatus[] }>({
    queryKey: ["/api/fees/my-status"],
  });

  const statuses = data?.statuses || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (statuses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          No children found. Add a dependent to see their fee status.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="fee-status-widget">
      {statuses.map((child) => (
        <Card key={child.playerId} data-testid={`fee-status-${child.playerId}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{child.playerName}</CardTitle>
              {child.upToDate ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Up to date
                </Badge>
              ) : (
                <Badge variant={child.nextPayment?.isOverdue ? "destructive" : "outline"}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {child.nextPayment?.isOverdue ? "Overdue" : "Payment due"}
                </Badge>
              )}
            </div>
            {child.nextPayment && (
              <CardDescription>
                {child.nextPayment.feeName} • £{(child.nextPayment.amount / 100).toFixed(2)} due{" "}
                {format(new Date(child.nextPayment.dueDate), "d MMM yyyy")}
              </CardDescription>
            )}
          </CardHeader>
          {child.nextPayment && (
            <CardContent>
              <Button
                size="sm"
                onClick={() => setPayingFor(child.nextPayment)}
                data-testid={`button-pay-${child.playerId}`}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Make Payment
              </Button>
            </CardContent>
          )}
        </Card>
      ))}

      <MockPaymentModal
        open={!!payingFor}
        onOpenChange={(open) => !open && setPayingFor(null)}
        feeAssignmentId={payingFor?.feeAssignmentId ?? null}
        feeName={payingFor?.feeName}
        amount={payingFor?.amount}
      />
    </div>
  );
}

