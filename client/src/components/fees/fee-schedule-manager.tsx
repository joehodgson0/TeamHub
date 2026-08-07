import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getSeasonOptions, getCurrentSeason } from "@/lib/season";
import { Loader2, Save } from "lucide-react";

interface FeeSchedule {
  id: string;
  clubId: string;
  season: string;
  coachFee: number;
  noMidweekFee: number;
  midweekFee: number;
  fullPaymentDiscountPercent: number;
  installmentCount: number;
}

const DEFAULTS = {
  coachFee: 6000,
  noMidweekFee: 25000,
  midweekFee: 35000,
  fullPaymentDiscountPercent: 10,
  installmentCount: 10,
};

function poundsToPence(value: string): number {
  const parsed = parseFloat(value || "0");
  return Math.round(parsed * 100);
}

function penceToPounds(value: number): string {
  return (value / 100).toFixed(2);
}

export default function FeeScheduleManager() {
  const { toast } = useToast();
  const seasonOptions = getSeasonOptions(6);
  const [season, setSeason] = useState(getCurrentSeason());

  const { data, isLoading } = useQuery<{ success: boolean; schedules: FeeSchedule[] }>({
    queryKey: ["/api/fee-schedules"],
  });

  const schedules = data?.schedules || [];
  const existing = schedules.find((s) => s.season === season);

  const [form, setForm] = useState({
    coachFee: penceToPounds(DEFAULTS.coachFee),
    noMidweekFee: penceToPounds(DEFAULTS.noMidweekFee),
    midweekFee: penceToPounds(DEFAULTS.midweekFee),
    fullPaymentDiscountPercent: String(DEFAULTS.fullPaymentDiscountPercent),
    installmentCount: String(DEFAULTS.installmentCount),
  });

  useEffect(() => {
    if (existing) {
      setForm({
        coachFee: penceToPounds(existing.coachFee),
        noMidweekFee: penceToPounds(existing.noMidweekFee),
        midweekFee: penceToPounds(existing.midweekFee),
        fullPaymentDiscountPercent: String(existing.fullPaymentDiscountPercent),
        installmentCount: String(existing.installmentCount),
      });
    } else {
      setForm({
        coachFee: penceToPounds(DEFAULTS.coachFee),
        noMidweekFee: penceToPounds(DEFAULTS.noMidweekFee),
        midweekFee: penceToPounds(DEFAULTS.midweekFee),
        fullPaymentDiscountPercent: String(DEFAULTS.fullPaymentDiscountPercent),
        installmentCount: String(DEFAULTS.installmentCount),
      });
    }
  }, [existing, season]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/fee-schedules", {
        season,
        coachFee: poundsToPence(form.coachFee),
        noMidweekFee: poundsToPence(form.noMidweekFee),
        midweekFee: poundsToPence(form.midweekFee),
        fullPaymentDiscountPercent: parseInt(form.fullPaymentDiscountPercent || "0", 10),
        installmentCount: parseInt(form.installmentCount || "10", 10),
      });
      return res.json();
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to save fee schedule" });
        return;
      }
      toast({ title: "Fee schedule saved", description: `Season ${season} fees updated.` });
      queryClient.invalidateQueries({ queryKey: ["/api/fee-schedules"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to save fee schedule" });
    },
  });

  return (
    <Card data-testid="card-fee-schedule-manager">
      <CardHeader>
        <CardTitle>Season Fee Schedule</CardTitle>
        <CardDescription>
          Set the default fees charged to parents each season. Parents choose to pay in full
          (with a discount) or in monthly installments from September to May.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-w-xs">
          <Label>Season</Label>
          <Select value={season} onValueChange={setSeason}>
            <SelectTrigger data-testid="select-fee-schedule-season">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {seasonOptions.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Coach parent fee (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.coachFee}
                onChange={(e) => setForm({ ...form, coachFee: e.target.value })}
                data-testid="input-coach-fee"
              />
              <p className="text-xs text-muted-foreground">Flat fee for a parent who is also a coach</p>
            </div>
            <div className="space-y-2">
              <Label>No mid-week training fee (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.noMidweekFee}
                onChange={(e) => setForm({ ...form, noMidweekFee: e.target.value })}
                data-testid="input-no-midweek-fee"
              />
            </div>
            <div className="space-y-2">
              <Label>Mid-week training fee (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.midweekFee}
                onChange={(e) => setForm({ ...form, midweekFee: e.target.value })}
                data-testid="input-midweek-fee"
              />
            </div>
            <div className="space-y-2">
              <Label>Full payment discount (%)</Label>
              <Input
                type="number"
                value={form.fullPaymentDiscountPercent}
                onChange={(e) => setForm({ ...form, fullPaymentDiscountPercent: e.target.value })}
                data-testid="input-discount-percent"
              />
            </div>
            <div className="space-y-2">
              <Label>Installment units (Sept = double)</Label>
              <Input
                type="number"
                value={form.installmentCount}
                onChange={(e) => setForm({ ...form, installmentCount: e.target.value })}
                data-testid="input-installment-count"
              />
              <p className="text-xs text-muted-foreground">
                10 units spread over 9 payments (Sept-May), first Sept payment counts as 2 units
              </p>
            </div>
          </div>
        )}

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-fee-schedule">
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Fee Schedule
        </Button>
      </CardContent>
    </Card>
  );
}
