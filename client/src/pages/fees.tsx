import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, PoundSterling, Calendar } from "lucide-react";
import FeeList from "@/components/fees/fee-list";
import CreateFeeModal from "@/components/modals/create-fee-modal";
import AssignFeeModal from "@/components/modals/assign-fee-modal";
import FeeAssignmentsTable from "@/components/fees/fee-assignments-table";
import FeeScheduleManager from "@/components/fees/fee-schedule-manager";
import SeasonOverview from "@/components/fees/season-overview";
import TeamFeeStatus from "@/components/fees/team-fee-status";
import ComingSoon from "@/components/ui/coming-soon";

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

function ManageFeesTab() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [activeTab, setActiveTab] = useState("all-fees");

  const { data: feesResponse, isLoading, refetch } = useQuery<{ success: boolean; fees: Fee[] }>({
    queryKey: ["/api/fees"],
  });

  const fees = feesResponse?.fees || [];
  const totalFees = fees.length;
  const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);

  const handleAssignFee = (fee: Fee) => {
    setSelectedFee(fee);
    setIsAssignModalOpen(true);
  };

  const handleViewAssignments = (fee: Fee) => {
    setSelectedFee(fee);
    setActiveTab("assignments");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Fee Management</h2>
          <p className="text-sm text-muted-foreground">Create and assign one-off fees (kit, tournaments, etc.)</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} data-testid="button-create-fee">
          <Plus className="h-4 w-4 mr-2" />
          Create Fee
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFees}</div>
            <p className="text-xs text-muted-foreground">Active fee types</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{(totalAmount / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Combined fee amounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Due</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fees.filter(f => new Date(f.dueDate) > new Date()).length}
            </div>
            <p className="text-xs text-muted-foreground">Fees with future due dates</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-fees">All Fees</TabsTrigger>
          <TabsTrigger value="assignments" disabled={!selectedFee}>
            {selectedFee ? `Assignments: ${selectedFee.name}` : "Assignments"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-fees" className="space-y-4">
          <FeeList
            fees={fees}
            isLoading={isLoading}
            onAssign={handleAssignFee}
            onViewAssignments={handleViewAssignments}
            onRefresh={refetch}
          />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          {selectedFee && (
            <FeeAssignmentsTable
              fee={selectedFee}
              onBack={() => {
                setSelectedFee(null);
                setActiveTab("all-fees");
              }}
            />
          )}
        </TabsContent>
      </Tabs>

      <CreateFeeModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => {
          refetch();
          setIsCreateModalOpen(false);
        }}
      />

      {selectedFee && (
        <AssignFeeModal
          open={isAssignModalOpen}
          onOpenChange={setIsAssignModalOpen}
          fee={selectedFee}
          onSuccess={() => {
            refetch();
            setIsAssignModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default function Fees() {
  const { isAdmin, hasRole } = useAuth();

  if (!isAdmin) {
    return (
      <ComingSoon description="Fee management is being set up for your club. Admins can preview it now - check back soon!" />
    );
  }

  const isCoach = hasRole("coach");

  return (
    <div className="space-y-6" data-testid="fees-page">
      <div>
        <h1 className="text-2xl font-bold">Fees & Payments Administration</h1>
        <p className="text-muted-foreground">Set up season fees and monitor payment status across your club</p>
      </div>

      <Tabs defaultValue="schedules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedules">Season Fee Schedules</TabsTrigger>
          <TabsTrigger value="overview">Team & Player Status</TabsTrigger>
          {isCoach && <TabsTrigger value="manage">Manage Fees</TabsTrigger>}
          {isCoach && <TabsTrigger value="team-status">My Team Status</TabsTrigger>}
        </TabsList>

        <TabsContent value="schedules">
          <FeeScheduleManager />
        </TabsContent>

        <TabsContent value="overview">
          <SeasonOverview />
        </TabsContent>

        {isCoach && (
          <TabsContent value="manage">
            <ManageFeesTab />
          </TabsContent>
        )}

        {isCoach && (
          <TabsContent value="team-status">
            <TeamFeeStatus />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
