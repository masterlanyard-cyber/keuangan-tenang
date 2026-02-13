import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

const rupiah = (n) =>
  "Rp " + Number(n || 0).toLocaleString("id-ID");

export default function Dashboard({ userEmail }) {
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Expense");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const raw = localStorage.getItem(`finance_${userEmail}`);
    if (raw) setTransactions(JSON.parse(raw));
  }, [mounted, userEmail]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(
      `finance_${userEmail}`,
      JSON.stringify(transactions)
    );
  }, [transactions, mounted, userEmail]);

  if (!mounted) return null;

  const saldo = transactions.reduce((acc, t) => {
    return t.type === "Income"
      ? acc + t.amount
      : acc - t.amount;
  }, 0);

  function addTransaction() {
    const n = Number(amount);
    if (!n) return;

    const newTx = {
      id: Date.now(),
      amount: n,
      type,
    };

    setTransactions([newTx, ...transactions]);
    setAmount("");
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.header}>
          <div>
            <div style={S.title}>Executive Finance</div>
            <div style={S.email}>{userEmail}</div>
          </div>
          <button style={S.logout} onClick={() => signOut()}>
            Logout
          </button>
        </div>

        <div style={S.saldoBox}>
          <div style={S.label}>Saldo</div>
          <div style={S.saldo}>{rupiah(saldo)}</div>
        </div>

        <div style={S.form}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={S.input}
          >
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
          </select>

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={S.input}
          />

          <button onClick={addTransaction} style={S.button}>
            Add Transaction
          </button>
        </div>

        <div style={S.list}>
          {transactions.length === 0 && (
            <div style={S.empty}>No transactions yet</div>
          )}

          {transactions.map((t) => (
            <div key={t.id} style={S.row}>
              <div>{t.type}</div>
              <div
                style={{
                  color:
                    t.type === "Income"
                      ? "#16a34a"
                      : "#dc2626",
                }}
              >
                {t.type === "Income" ? "+" : "-"}
                {rupiah(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    padding: 16,
    display: "flex",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "#111827",
    borderRadius: 16,
    padding: 20,
    color: "#e5e7eb",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
  },
  email: {
    fontSize: 12,
    color: "#9ca3af",
  },
  logout: {
    background: "#1f2937",
    color: "#e5e7eb",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },
  saldoBox: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: "#9ca3af",
  },
  saldo: {
    fontSize: 26,
    fontWeight: 700,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 20,
  },
  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #374151",
    background: "#0f172a",
    color: "#e5e7eb",
  },
  button: {
    padding: 12,
    borderRadius: 8,
    border: "none",
    background: "#d4af37",
    fontWeight: 600,
    cursor: "pointer",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    background: "#1f2937",
    padding: 10,
    borderRadius: 8,
  },
  empty: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 14,
  },
};

