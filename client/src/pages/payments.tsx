import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OutstandingFees from "@/components/payments/outstanding-fees";
import PaymentHistory from "@/components/payments/payment-history";
import FeeStatusWidget from "@/components/payments/fee-status-widget";
import SeasonEnrollment from "@/components/payments/season-enrollment";
import ComingSoon from "@/components/ui/coming-soon";

export default function Payments() {
  const { isAdmin, hasRole } = useAuth();

  if (!isAdmin) {
    return (
      <ComingSoon description="Online payments are being set up for your club. Admins can preview it now - check back soon!" />
    );
  }

  if (!hasRole("parent")) {
    return (
      <div className="space-y-6" data-testid="payments-page">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            You don't have the parent role, so there's nothing to pay here. Add the parent role in Settings to test this view.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="payments-page">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground">View and pay fees for your children</p>
      </div>

      <SeasonEnrollment />

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Fee Status</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding Fees</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <FeeStatusWidget />
        </TabsContent>

        <TabsContent value="outstanding">
          <OutstandingFees />
        </TabsContent>

        <TabsContent value="history">
          <PaymentHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
