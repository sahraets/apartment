import type { Budget, BudgetSummary, Item, Room } from "@/types";

/**
 * Regner ut budsjettstatus. Ren funksjon uten I/O — budsjett lagres aldri,
 * det utledes alltid fra tingene i rommet.
 */
export function calculateBudget(room: Room, items: Item[]): Budget {
  const sumOf = (predicate: (item: Item) => boolean) =>
    items.filter(predicate).reduce((total, item) => total + item.price, 0);

  const spent = sumOf((item) => item.status === "bought");
  const ordered = sumOf((item) => item.status === "ordered");
  const wished = sumOf((item) => item.status === "wished");
  const committed = spent + ordered;

  return {
    roomId: room.id,
    planned: room.budget,
    spent,
    committed,
    wished,
    remaining: room.budget - committed,
    usedPercent: room.budget > 0 ? (committed / room.budget) * 100 : 0,
  };
}

/** Slår sammen budsjettene til en totaloversikt for hele leiligheten. */
export function summarizeBudgets(budgets: Budget[]): BudgetSummary {
  const total = budgets.reduce(
    (acc, budget) => ({
      planned: acc.planned + budget.planned,
      spent: acc.spent + budget.spent,
      committed: acc.committed + budget.committed,
      wished: acc.wished + budget.wished,
    }),
    { planned: 0, spent: 0, committed: 0, wished: 0 },
  );

  return {
    ...total,
    remaining: total.planned - total.committed,
    usedPercent: total.planned > 0 ? (total.committed / total.planned) * 100 : 0,
  };
}
