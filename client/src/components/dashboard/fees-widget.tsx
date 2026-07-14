import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PoundSterling, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

interface OutstandingResponse {
  success: boolean;
  outstanding: any[];
  totalAmount: number;
  count: number;
}

interface Fee {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
}

interface FeeAssignment {
  status: string;
  amountPaid: number;
  amountDue: number;
}

export default function FeesWidget() {
  const { hasRole } = useAuth();
  const [, setLocation] = useLocation();

  // For parents: fetch outstanding fees
  const { data: outstandingData, isLoading: isLoadingOutstanding } = useQuery<OutstandingResponse>({
    queryKey: ["/api/payments/outstanding"],
    enabled: hasRole("parent"),
  });

  // For coaches: fetch all fees to calculate club-wide stats
  const { data: feesData, isLoading: isLoadingFees } = useQuery<{ success: boolean; fees: Fee[] }>({
    queryKey: ["/api/fees"],
    enabled: hasRole("coach"),
  });

  const isLoading = isLoadingOutstanding || isLoadingFees;

  const formatAmount = (amount: number) => {
    return `£${(amount / 100).toFixed(2)}`;
  };

  // Parent View
  if (hasRole("parent")) {
    const outstanding = outstandingData?.outstanding || [];
    const totalAmount = outstandingData?.totalAmount || 0;
    const overdueCount = outstanding.filter(
      (f) => new Date(f.dueDate) < new Date()
    ).length;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Fees</CardTitle>
          <PoundSterling className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-[100px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          ) : outstanding.length === 0 ? (
            <div>
              <div className="text-2xl font-bold text-green-600">All paid!</div>
              <p className="text-xs text-muted-foreground">
                You have no outstanding fees
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{formatAmount(totalAmount)}</span>
                {overdueCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {overdueCount} overdue
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {outstanding.length} fee{outstanding.length !== 1 ? "s" : ""} outstanding
              </p>
              <Button
                variant="link"
                className="p-0 h-auto mt-2 text-sm"
                onClick={() => setLocation("/payments")}
              >
                Pay now
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Coach View - Show club-wide fee stats
  if (hasRole("coach")) {
    const fees = feesData?.fees || [];

    // We'll show a summary - in a real app you'd fetch aggregated data from the server
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fee Management</CardTitle>
          <PoundSterling className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-[100px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          ) : fees.length === 0 ? (
            <div>
              <div className="text-2xl font-bold">No fees</div>
              <p className="text-xs text-muted-foreground">
                Create your first fee to start collecting
              </p>
              <Button
                variant="link"
                className="p-0 h-auto mt-2 text-sm"
                onClick={() => setLocation("/fees")}
              >
                Create fee
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          ) : (
            <div>
              <div className="text-2xl font-bold">{fees.length} fees</div>
              <p className="text-xs text-muted-foreground">
                Active in your club
              </p>
              <Button
                variant="link"
                className="p-0 h-auto mt-2 text-sm"
                onClick={() => setLocation("/fees")}
              >
                Manage fees
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
