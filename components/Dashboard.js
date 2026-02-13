import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { signOut } from "next-auth/react";

const Pie = dynamic(
  () =>
    import("react-chartjs-2").then((mod) => mod.Pie),
  { ssr: false }
);

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const rupiah = (n) =>
  "Rp " + Number(n || 0).toLocaleString("id-ID");

const CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Entertainment",
  "Other",
];

export default function Dashboard({ userEmail }) {
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Expense");
  const [category, setCategory] = useState("Food");
  const [savingGoal, setSavingGoal] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const raw = localStorage.getItem(
      `finance_${userEmail}`
    );
    if (raw) {
      const data = JSON.parse(raw);
      setTransactions(data.transactions || []);
      setSavingGoal(data.savingGoal || 0);
    }
  }, [mounted, userEmail]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(
      `finance_${userEmail}`,
      JSON.stringify({
        transactions,
        savingGoal,
      })
    );
  }, [transactions, savingGoal, mounted, userEmail]);

  if (!mounted) return null;

  const filtered = transactions.filter((t) => {
    const d = t.date;
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  });

  const saldo = filtered.reduce((acc, t) => {
    return t.type === "Income"
      ? acc + t.amount
      : acc - t.amount;
  }, 0);

  const savingProgress =
    savingGoal > 0
      ? Math.min((saldo / savingGoal) * 100, 100)
      : 0;

  function addTransaction() {
    const n = Number(amount);
    if (!n) return;

    const newTx = {
      id: Date.now(),
      amount: n,
      type,
      category,
      date: new Date().toISOString().slice(0, 10),
    };

    setTransactions([newTx, ...transactions]);
    setAmount("");
  }

  const categoryTotals = useMemo(() => {
    const totals = {};
    filtered.forEach((t) => {
      if (t.type === "Expense") {
        totals[t.category] =
          (totals[t.category] || 0) + t.amount;
      }
    });
    return totals;
  }, [filtered]);

  const pieData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        data: Object.values(categoryTotals),
        backgroundColor: [
          "#d4af37",
          "#4ade80",
          "#60a5fa",
          "#f472b6",
          "#f87171",
          "#a78bfa",
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.header}>
          <div>
            <div style={S.title}>
              Executive Finance
            </div>
            <div style={S.email}>
              {userEmail}
            </div>
          </div>
          <button style={S.logout} onClick={() => signOut()}>
            Logout
          </button>
        </div>

        <div style={S.hero}>
          <div style={S.label}>Saldo</div>
          <div style={S.saldo}>
            {rupiah(saldo)}
          </div>
        </div>

        {/* Saving Goal */}
        <div style={S.section}>
          <div style={S.label}>Saving Goal</div>
          <input
            type="number"
            placeholder="Target"
            value={savingGoal}
            onChange={(e) =>
              setSavingGoal(Number(e.target.value))
            }
            style={S.input}
          />
          <div style={S.progressBg}>
            <div
              style={{
                ...S.progressFill,
                width: `${savingProgress}%`,
              }}
            />
          </div>
          <div style={S.muted}>
            {savingProgress.toFixed(1)}%
          </div>
        </div>

        {/* Add Transaction */}
        <div style={S.section}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={S.input}
          >
            <option>Expense</option>
            <option>Income</option>
          </select>

          {type === "Expense" && (
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              style={S.input}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          )}

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
            style={S.input}
          />

          <button
            style={S.button}
            onClick={addTransaction}
          >
            Add
          </button>
        </div>

        {/* Filter */}
        <div style={S.section}>
          <div style={S.label}>
            Filter Date
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) =>
              setFromDate(e.target.value)
            }
            style={S.input}
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) =>
              setToDate(e.target.value)
            }
            style={S.input}
          />
        </div>

        {/* Pie Chart */}
        {Object.keys(categoryTotals).length >
          0 && (
          <div style={{ marginTop: 30 }}>
            <Pie data={pieData} />
          </div>
        )}

        {/* List */}
        <div style={{ marginTop: 30 }}>
          {filtered.map((t) => (
            <div key={t.id} style={S.row}>
              <div>
                {t.date} - {t.category}
              </div>
              <div
                style={{
                  color:
                    t.type === "Income"
                      ? "#22c55e"
                      : "#ef4444",
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
    background: "#0f1115",
    padding: 16,
    display: "flex",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#111827",
    borderRadius: 20,
    padding: 24,
    color: "#e5e7eb",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  title: { fontSize: 20, fontWeight: 600 },
  email: { fontSize: 12, color: "#9ca3af" },
  logout: {
    background: "#1f2937",
    border: "none",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 8,
  },
  hero: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: "#9ca3af",
  },
  saldo: {
    fontSize: 28,
    fontWeight: 700,
  },
  section: {
    marginTop: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #374151",
    background: "#0f172a",
    color: "#fff",
  },
  button: {
    padding: 12,
    borderRadius: 8,
    background: "#d4af37",
    border: "none",
    fontWeight: 600,
  },
  progressBg: {
    height: 8,
    background: "#1f2937",
    borderRadius: 6,
  },
  progressFill: {
    height: "100%",
    background: "#d4af37",
    borderRadius: 6,
  },
  muted: { fontSize: 12, color: "#9ca3af" },
  row: {
    display: "flex",
    justifyContent: "space-between",
    background: "#1f2937",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
};

