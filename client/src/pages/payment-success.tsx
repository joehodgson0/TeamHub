import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const queryClient = useQueryClient();

  // Parse query params
  const params = new URLSearchParams(searchString);
  const sessionId = params.get("session_id");

  // Invalidate payment-related queries to refresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/payments/outstanding"] });
    queryClient.invalidateQueries({ queryKey: ["/api/payments/history"] });
    queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
  }, [queryClient]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your payment. A receipt has been sent to your email.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Your payment has been processed successfully. The fee status will be updated shortly.
          </p>
          {sessionId && (
            <p className="text-xs text-muted-foreground font-mono">
              Reference: {sessionId.slice(0, 20)}...
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            className="w-full" 
            onClick={() => setLocation("/payments")}
          >
            View Payment History
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setLocation("/dashboard")}
          >
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
