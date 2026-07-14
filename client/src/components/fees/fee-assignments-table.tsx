import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Check, Clock, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Fee {
  id: string;
  name: string;
  amount: number;
}

interface FeeAssignment {
  id: string;
  feeId: string;
  playerId: string;
  teamId: string;
  status: "pending" | "paid" | "overdue" | "partial" | "cancelled";
  amountDue: number;
  amountPaid: number;
  paidAt: string | null;
  createdAt: string;
  playerName: string;
  teamName: string;
}

interface FeeAssignmentsTableProps {
  fee: Fee;
  onBack: () => void;
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  paid: { icon: <Check className="h-3 w-3" />, label: "Paid", variant: "default" },
  pending: { icon: <Clock className="h-3 w-3" />, label: "Pending", variant: "secondary" },
  overdue: { icon: <AlertTriangle className="h-3 w-3" />, label: "Overdue", variant: "destructive" },
  partial: { icon: <Clock className="h-3 w-3" />, label: "Partial", variant: "outline" },
  cancelled: { icon: <XCircle className="h-3 w-3" />, label: "Cancelled", variant: "outline" },
};

export default function FeeAssignmentsTable({ fee, onBack }: FeeAssignmentsTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch assignments for this fee
  const { data: assignmentsResponse, isLoading } = useQuery<{ success: boolean; assignments: FeeAssignment[] }>({
    queryKey: [`/api/fees/${fee.id}/assignments`],
  });

  const assignments = assignmentsResponse?.assignments || [];

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter;
    const matchesSearch = 
      assignment.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.teamName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate stats
  const stats = {
    total: assignments.length,
    paid: assignments.filter(a => a.status === "paid").length,
    pending: assignments.filter(a => a.status === "pending").length,
    overdue: assignments.filter(a => a.status === "overdue").length,
    totalCollected: assignments.reduce((sum, a) => sum + a.amountPaid, 0),
    totalExpected: assignments.reduce((sum, a) => sum + a.amountDue, 0),
  };

  const formatAmount = (amount: number) => {
    return `£${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd MMM yyyy");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Fees
        </Button>
        <div>
          <h2 className="text-lg font-semibold">{fee.name}</h2>
          <p className="text-sm text-muted-foreground">{formatAmount(fee.amount)} per player</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Assigned</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Paid</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.paid}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Collected</CardDescription>
            <CardTitle className="text-2xl">
              {formatAmount(stats.totalCollected)}
              <span className="text-sm text-muted-foreground font-normal">
                {" "}/ {formatAmount(stats.totalExpected)}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by player or team..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:max-w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">
                {assignments.length === 0
                  ? "No players have been assigned this fee yet."
                  : "No results match your filters."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Payment Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => {
                  const status = statusConfig[assignment.status] || statusConfig.pending;
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.playerName}
                      </TableCell>
                      <TableCell>{assignment.teamName}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          {status.icon}
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatAmount(assignment.amountPaid)}
                        {assignment.status === "partial" && (
                          <span className="text-muted-foreground">
                            {" "}/ {formatAmount(assignment.amountDue)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(assignment.paidAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
