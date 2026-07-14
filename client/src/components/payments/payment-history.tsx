import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Receipt, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Payment {
  id: string;
  feeAssignmentId: string;
  amount: number;
  displayAmount: string;
  provider: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  receiptUrl?: string;
  createdAt: string;
  feeName: string;
  playerName: string;
}

interface PaymentHistoryResponse {
  success: boolean;
  payments: Payment[];
  count: number;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  succeeded: { label: "Paid", variant: "default" },
  pending: { label: "Processing", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
  refunded: { label: "Refunded", variant: "outline" },
};

export default function PaymentHistory() {
  const { data, isLoading } = useQuery<PaymentHistoryResponse>({
    queryKey: ["/api/payments/history"],
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <Skeleton className="h-8 w-[80px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const payments = data?.payments || [];

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">No payment history</h3>
              <p className="text-sm text-muted-foreground">
                Your payment history will appear here once you make a payment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const status = statusConfig[payment.status] || statusConfig.pending;
              return (
                <TableRow key={payment.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(payment.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {payment.feeName}
                  </TableCell>
                  <TableCell>{payment.playerName}</TableCell>
                  <TableCell className="font-medium">
                    £{payment.displayAmount}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.receiptUrl ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={payment.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Receipt className="h-4 w-4 mr-1" />
                          View
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
