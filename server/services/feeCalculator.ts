import type { FeeSchedule, FeeType, PaymentOption } from "@shared/schema";

/**
 * Shared season-fee calculation logic used by both the fee enrollment
 * route (server/routes.ts) and the reminder background service.
 */

export interface InstallmentPlanItem {
  installmentNumber: number;
  amount: number; // pence
  dueDate: Date;
}

/** Determine which default rate a player/parent should be charged. */
export function determineFeeType(parentIsCoach: boolean, teamMidWeekTraining: boolean): FeeType {
  if (parentIsCoach) return "coach";
  return teamMidWeekTraining ? "midweek" : "no_midweek";
}

/** Base (undiscounted) fee amount in pence for a given fee type. */
export function getBaseFeeAmount(schedule: FeeSchedule, feeType: FeeType): number {
  switch (feeType) {
    case "coach":
      return schedule.coachFee;
    case "midweek":
      return schedule.midweekFee;
    case "no_midweek":
    default:
      return schedule.noMidweekFee;
  }
}

/** Parse a "2026/27" season string into its starting calendar year. */
export function seasonStartYear(season: string): number {
  const match = season.match(/^(\d{4})\/(\d{2})$/);
  if (!match) throw new Error(`Invalid season format: ${season}`);
  return parseInt(match[1], 10);
}

/**
 * Build the full payment plan for a player, given the club's fee schedule,
 * their fee type, and their chosen payment option.
 *
 * - "full": single payment due 1 Sept, discounted by fullPaymentDiscountPercent.
 * - "installments": 9 monthly transactions (Sept through May), split into
 *   `installmentCount` (default 10) equal units, with the first (September)
 *   transaction counting as a double unit.
 */
export function buildInstallmentPlan(
  schedule: FeeSchedule,
  feeType: FeeType,
  paymentOption: PaymentOption,
  season: string
): { totalAmount: number; installments: InstallmentPlanItem[] } {
  const baseAmount = getBaseFeeAmount(schedule, feeType);
  const startYear = seasonStartYear(season);

  if (paymentOption === "full") {
    const discount = schedule.fullPaymentDiscountPercent ?? 0;
    const totalAmount = Math.round(baseAmount * (1 - discount / 100));
    return {
      totalAmount,
      installments: [
        { installmentNumber: 1, amount: totalAmount, dueDate: new Date(startYear, 8, 1) }, // 1 Sept
      ],
    };
  }

  // Installments: Sept (double unit), Oct, Nov, Dec, Jan, Feb, Mar, Apr, May
  const unitCount = schedule.installmentCount || 10;
  const unitAmount = Math.round(baseAmount / unitCount);
  const months: { month: number; year: number; units: number }[] = [
    { month: 9, year: startYear, units: 2 },
    { month: 10, year: startYear, units: 1 },
    { month: 11, year: startYear, units: 1 },
    { month: 12, year: startYear, units: 1 },
    { month: 1, year: startYear + 1, units: 1 },
    { month: 2, year: startYear + 1, units: 1 },
    { month: 3, year: startYear + 1, units: 1 },
    { month: 4, year: startYear + 1, units: 1 },
    { month: 5, year: startYear + 1, units: 1 },
  ];

  const installments: InstallmentPlanItem[] = months.map((m, index) => ({
    installmentNumber: index + 1,
    amount: unitAmount * m.units,
    dueDate: new Date(m.year, m.month - 1, 1),
  }));

  // Correct rounding drift on the final installment so the total matches exactly.
  const runningTotal = installments.reduce((sum, i) => sum + i.amount, 0);
  const drift = baseAmount - runningTotal;
  if (drift !== 0) {
    installments[installments.length - 1].amount += drift;
  }

  return { totalAmount: baseAmount, installments };
}
