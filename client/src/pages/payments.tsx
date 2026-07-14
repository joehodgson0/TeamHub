import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import OutstandingFees from "@/components/payments/outstanding-fees";
import PaymentHistory from "@/components/payments/payment-history";

export default function Payments() {
  const { hasRole } = useAuth();

  if (!hasRole("parent")) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">Parent Access Only</h3>
                <p className="text-sm text-muted-foreground">
                  This page is for parents to view and pay fees. 
                  If you're a coach, visit the Fees page to manage fees.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="payments-page">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground">View and pay fees for your children</p>
      </div>

      <Tabs defaultValue="outstanding" className="space-y-4">
        <TabsList>
          <TabsTrigger value="outstanding">Outstanding Fees</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

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
