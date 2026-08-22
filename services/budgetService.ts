import type { Budget } from "@/types";

/** Client-service: visningshjelpere for budsjett. All utregning skjer i backend. */

const nok = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  maximumFractionDigits: 0,
});

export function formatNok(amount: number): string {
  return nok.format(amount);
}

/** Bredden på budsjettlinja i prosent, kuttet på 100 så den ikke renner over. */
export function barWidth(budget: Budget): number {
  return Math.min(100, Math.max(0, budget.usedPercent));
}

/** Hvor anstrengt budsjettet er — styrer fargen på linja. */
export function budgetTone(budget: Budget): "ok" | "tight" | "over" {
  if (budget.remaining < 0) return "over";
  if (budget.usedPercent >= 80) return "tight";
  return "ok";
}