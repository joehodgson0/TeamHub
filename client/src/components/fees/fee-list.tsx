import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Users, Eye, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Fee {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  dueDate: string;
  category: string;
  isRecurring: boolean;
  createdAt: string;
}

interface FeeAssignment {
  id: string;
  status: string;
  amountPaid: number;
  amountDue: number;
}

interface FeeListProps {
  fees: Fee[];
  isLoading: boolean;
  onAssign: (fee: Fee) => void;
  onViewAssignments: (fee: Fee) => void;
  onRefresh: () => void;
}

const categoryColors: Record<string, string> = {
  subscription: "bg-blue-100 text-blue-800",
  kit: "bg-purple-100 text-purple-800",
  tournament: "bg-green-100 text-green-800",
  social: "bg-yellow-100 text-yellow-800",
  other: "bg-gray-100 text-gray-800",
};

export default function FeeList({ fees, isLoading, onAssign, onViewAssignments, onRefresh }: FeeListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (feeId: string) => {
      return apiRequest("DELETE", `/api/fees/${feeId}`);
    },
    onSuccess: () => {
      toast({
        title: "Fee deleted",
        description: "The fee has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete fee",
        variant: "destructive",
      });
    },
  });

  const formatAmount = (amount: number) => {
    return `£${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy");
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (fees.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">No fees yet</h3>
              <p className="text-sm text-muted-foreground">
                Create your first fee to start collecting payments from parents.
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
              <TableHead>Fee Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fees.map((fee) => (
              <FeeRow
                key={fee.id}
                fee={fee}
                formatAmount={formatAmount}
                formatDate={formatDate}
                isOverdue={isOverdue}
                onAssign={onAssign}
                onViewAssignments={onViewAssignments}
                onDelete={() => deleteMutation.mutate(fee.id)}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface FeeRowProps {
  fee: Fee;
  formatAmount: (amount: number) => string;
  formatDate: (date: string) => string;
  isOverdue: (date: string) => boolean;
  onAssign: (fee: Fee) => void;
  onViewAssignments: (fee: Fee) => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function FeeRow({ 
  fee, 
  formatAmount, 
  formatDate, 
  isOverdue, 
  onAssign, 
  onViewAssignments, 
  onDelete,
  isDeleting 
}: FeeRowProps) {
  // Fetch assignment stats for this fee
  const { data: assignmentsResponse } = useQuery<{ success: boolean; assignments: FeeAssignment[] }>({
    queryKey: [`/api/fees/${fee.id}/assignments`],
  });

  const assignments = assignmentsResponse?.assignments || [];
  const paidCount = assignments.filter(a => a.status === "paid").length;
  const totalCount = assignments.length;

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{fee.name}</div>
          {fee.description && (
            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
              {fee.description}
            </div>
          )}
          {totalCount > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {paidCount}/{totalCount} paid
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="font-medium">{formatAmount(fee.amount)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {formatDate(fee.dueDate)}
          {isOverdue(fee.dueDate) && (
            <Badge variant="destructive" className="text-xs">Overdue</Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge className={categoryColors[fee.category] || categoryColors.other}>
          {fee.category}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAssign(fee)}>
              <Users className="h-4 w-4 mr-2" />
              Assign to Players
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewAssignments(fee)}>
              <Eye className="h-4 w-4 mr-2" />
              View Assignments
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDelete}
              disabled={isDeleting || paidCount > 0}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Fee
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
