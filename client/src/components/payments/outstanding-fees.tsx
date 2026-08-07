import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isPast } from "date-fns";
import { CreditCard, Calendar, User, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import MockPaymentModal from "@/components/modals/mock-payment-modal";

interface OutstandingFee {
  id: string;
  feeId: string;
  playerId: string;
  teamId: string;
  status: string;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  feeName: string;
  feeDescription?: string;
  feeCategory: string;
  dueDate: string;
  playerName: string;
  teamName: string;
}

interface OutstandingResponse {
  success: boolean;
  outstanding: OutstandingFee[];
  totalAmount: number;
  count: number;
}

export default function OutstandingFees() {
  const [payingFor, setPayingFor] = useState<OutstandingFee | null>(null);

  // Fetch outstanding fees
  const { data, isLoading, refetch } = useQuery<OutstandingResponse>({
    queryKey: ["/api/payments/outstanding"],
  });

  const formatAmount = (amount: number) => {
    return `£${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy");
  };

  const isOverdue = (dueDate: string) => {
    return isPast(new Date(dueDate));
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[80px]" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  const outstanding = data?.outstanding || [];
  const totalAmount = data?.totalAmount || 0;

  if (outstanding.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">All caught up!</h3>
              <p className="text-sm text-muted-foreground">
                You have no outstanding fees to pay.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Outstanding</p>
              <p className="text-2xl font-bold">{formatAmount(totalAmount)}</p>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {outstanding.length} fee{outstanding.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Fee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {outstanding.map((fee) => (
          <Card key={fee.id} className={isOverdue(fee.dueDate) ? "border-destructive/50" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{fee.feeName}</CardTitle>
                  <CardDescription>{fee.feeDescription}</CardDescription>
                </div>
                {isOverdue(fee.dueDate) && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Overdue
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{fee.playerName}</span>
                <span>•</span>
                <span>{fee.teamName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Due: {formatDate(fee.dueDate)}</span>
              </div>
              <div className="pt-2">
                <div className="text-2xl font-bold">{formatAmount(fee.amountRemaining)}</div>
                {fee.amountPaid > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {formatAmount(fee.amountPaid)} already paid
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => setPayingFor(fee)}
                data-testid={`button-pay-${fee.id}`}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <MockPaymentModal
        open={!!payingFor}
        onOpenChange={(open) => !open && setPayingFor(null)}
        feeAssignmentId={payingFor?.id ?? null}
        feeName={payingFor?.feeName}
        amount={payingFor?.amountRemaining}
      />
    </div>
  );
}
