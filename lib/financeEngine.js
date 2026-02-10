// lib/financeEngine.js

export const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Entertainment",
  "Saving",
  "Investment",
  "Other"
];

export function initFinance() {
  return {
    transactions: [],
    budgets: {},
    savings: { goal: 0, current: 0 },
    investments: [],
    debts: [],
    assets: []
  };
}

export function addTransaction(finance, tx) {
  finance.transactions.unshift(tx);
  return finance;
}

export function computeCategoryExpense(finance) {
  const map = {};
  finance.transactions.forEach(t => {
    if (t.type === "Expense") {
      map[t.category] = (map[t.category] || 0) + t.amount;
    }
  });
  return map;
}

export function computeEnvelopeStatus(finance) {
  const spent = computeCategoryExpense(finance);
  const status = {};
  Object.keys(finance.budgets).forEach(cat => {
    const limit = finance.budgets[cat];
    const used = spent[cat] || 0;
    const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
    status[cat] = { limit, used, pct };
  });
  return status;
}

export function computeNetWorth(finance, cashSaldo) {
  const investmentTotal = finance.investments.reduce((a,b)=>a+b.amount,0);
  const assetTotal = finance.assets.reduce((a,b)=>a+b.amount,0);
  const debtTotal = finance.debts.reduce((a,b)=>a+b.balance,0);

  const assets = cashSaldo + finance.savings.current + investmentTotal + assetTotal;
  const liabilities = debtTotal;

  return {
    assets,
    liabilities,
    netWorth: assets - liabilities
  };
}

