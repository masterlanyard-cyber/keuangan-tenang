// lib/forecastEngine.js

export function forecastEndOfMonth(saldo, transactions) {
  const expenses = transactions.filter(t=>t.type==="Expense");
  if (expenses.length === 0) return saldo;

  const avgExpense = expenses.reduce((a,b)=>a+b.amount,0) / expenses.length;
  const today = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
  const remainingDays = daysInMonth - today;

  return Math.round(saldo - avgExpense * remainingDays);
}

export function debtSnowball(debts) {
  return [...debts].sort((a,b)=>a.balance - b.balance);
}

export function debtAvalanche(debts) {
  return [...debts].sort((a,b)=>b.interest - a.interest);
}

