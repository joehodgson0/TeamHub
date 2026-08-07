import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CreditCard, CheckCircle2, Loader2 } from "lucide-react";

interface MockPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeAssignmentId: string | null;
  feeName?: string;
  amount?: number;
}

const initialCard = { number: "", expiry: "", cvc: "", name: "" };

/**
 * Mocked card payment modal. No real payment gateway is called - this simulates
 * a successful card payment so the fee/enrollment flow can be tested end-to-end.
 */
export default function MockPaymentModal({ open, onOpenChange, feeAssignmentId, feeName, amount }: MockPaymentModalProps) {
  const { toast } = useToast();
  const [card, setCard] = useState(initialCard);
  const [succeeded, setSucceeded] = useState(false);

  const payMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/mock-pay", { feeAssignmentId });
      return res.json();
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast({ variant: "destructive", title: "Payment failed", description: result.error || "Please try again." });
        return;
      }
      setSucceeded(true);
      queryClient.invalidateQueries({ queryKey: ["/api/fees/my-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/outstanding"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/history"] });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Payment failed", description: error.message || "Please try again." });
    },
  });

  const handleClose = (next: boolean) => {
    if (!next) {
      setCard(initialCard);
      setSucceeded(false);
    }
    onOpenChange(next);
  };

  const canSubmit = card.number.length >= 12 && card.expiry.length >= 4 && card.cvc.length >= 3 && card.name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-mock-payment">
        {succeeded ? (
          <div className="flex flex-col items-center text-center space-y-4 py-6">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <div>
              <h3 className="font-semibold text-lg">Payment made</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {feeName ? `${feeName} - ` : ""}
                {amount != null ? `£${(amount / 100).toFixed(2)} paid successfully.` : "Payment successful."}
              </p>
            </div>
            <Button onClick={() => handleClose(false)} data-testid="button-close-payment-success">Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Make Payment
              </DialogTitle>
              <DialogDescription>
                {feeName && <span className="block">{feeName}</span>}
                {amount != null && <span className="block font-semibold text-foreground">£{(amount / 100).toFixed(2)}</span>}
                This is a mocked payment for testing - no real card is charged.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="card-name">Name on card</Label>
                <Input
                  id="card-name"
                  placeholder="J Smith"
                  value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value })}
                  data-testid="input-card-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-number">Card number</Label>
                <Input
                  id="card-number"
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value.replace(/[^\d ]/g, "") })}
                  data-testid="input-card-number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="card-expiry">Expiry</Label>
                  <Input
                    id="card-expiry"
                    placeholder="MM/YY"
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                    data-testid="input-card-expiry"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-cvc">CVC</Label>
                  <Input
                    id="card-cvc"
                    placeholder="123"
                    inputMode="numeric"
                    value={card.cvc}
                    onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "") })}
                    data-testid="input-card-cvc"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                className="w-full"
                disabled={!canSubmit || payMutation.isPending}
                onClick={() => payMutation.mutate()}
                data-testid="button-submit-payment"
              >
                {payMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {amount != null ? `Pay £${(amount / 100).toFixed(2)}` : "Pay Now"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
