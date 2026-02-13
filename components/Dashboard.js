import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { signOut } from "next-auth/react";

const ChartSection = dynamic(
  () => import("./ChartSection"),
  { ssr: false }
);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const raw = localStorage.getItem(
        `finance_${userEmail}`
      );
      if (raw) {
        const data = JSON.parse(raw);
        setTransactions(
          Array.isArray(data.transactions)
            ? data.transactions
            : []
        );
        setSavingGoal(
          typeof data.savingGoal === "number"
            ? data.savingGoal
            : 0
        );
      }
    } catch {
      setTransactions([]);
      setSavingGoal(0);
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

  let saldo = 0;
  const categoryTotals = {};

  transactions.forEach((t) => {
    if (!t || typeof t.amount !== "number") return;

    if (t.type === "Income") {
      saldo += t.amount;
    } else {
      saldo -= t.amount;
      if (t.category) {
        categoryTotals[t.category] =
          (categoryTotals[t.category] || 0) +
          t.amount;
      }
    }
  });

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
      <div style={S.container}>
        {/* HEADER */}
        <div style={S.header}>
          <div>
            <div style={S.brand}>
              Executive Finance
            </div>
            <div style={S.email}>
              {userEmail}
            </div>
          </div>
          <button
            style={S.logout}
            onClick={() => signOut()}
          >
            Logout
          </button>
        </div>

        {/* NET WORTH CARD */}
        <div style={S.hero}>
          <div style={S.heroLabel}>
            Net Balance
          </div>
          <div style={S.heroValue}>
            {rupiah(saldo)}
          </div>
        </div>

        {/* SAVING PROGRESS */}
        <div style={S.sectionCard}>
          <div style={S.sectionTitle}>
            Saving Goal
          </div>
          <input
            type="number"
            placeholder="Target Amount"
            value={savingGoal}
            onChange={(e) =>
              setSavingGoal(
                Number(e.target.value)
              )
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
          <div style={S.progressText}>
            {savingProgress.toFixed(1)}%
          </div>
        </div>

        {/* ADD TRANSACTION */}
        <div style={S.sectionCard}>
          <div style={S.sectionTitle}>
            Add Transaction
          </div>

          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value)
            }
            style={S.input}
          >
            <option>Expense</option>
            <option>Income</option>
          </select>

          {type === "Expense" && (
            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              style={S.input}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>
                  {c}
                </option>
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
            style={S.primaryButton}
            onClick={addTransaction}
          >
            Add
          </button>
        </div>

        {/* PIE CHART */}
        {Object.keys(categoryTotals)
          .length > 0 && (
          <div style={S.sectionCard}>
            <div style={S.sectionTitle}>
              Spending Distribution
            </div>
            <ChartSection data={pieData} />
          </div>
        )}

        {/* TRANSACTION LIST */}
        <div style={S.sectionCard}>
          <div style={S.sectionTitle}>
            Transactions
          </div>

          {transactions.map((t) => (
            <div
              key={t.id}
              style={S.row}
            >
              <div style={S.rowLeft}>
                {t.category}
              </div>
              <div
                style={{
                  ...S.rowRight,
                  color:
                    t.type === "Income"
                      ? "#22c55e"
                      : "#ef4444",
                }}
              >
                {t.type === "Income"
                  ? "+"
                  : "-"}
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
    background:
      "linear-gradient(135deg,#0b1220,#0f172a)",
    padding: 20,
    display: "flex",
    justifyContent: "center",
  },
  container: {
    width: "100%",
    maxWidth: 540,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  brand: {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  email: {
    fontSize: 12,
    color: "#9ca3af",
  },
  logout: {
    background: "rgba(255,255,255,0.08)",
    border: "none",
    padding: "8px 14px",
    borderRadius: 12,
    color: "#fff",
    backdropFilter: "blur(8px)",
  },
  hero: {
    background:
      "linear-gradient(135deg,#1f2937,#111827)",
    padding: 28,
    borderRadius: 24,
    marginBottom: 24,
  },
  heroLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 6,
  },
  heroValue: {
    fontSize: 34,
    fontWeight: 700,
  },
  sectionCard: {
    background: "rgba(255,255,255,0.05)",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    backdropFilter: "blur(12px)",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
  },
  input: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid #374151",
    background: "#0f172a",
    color: "#fff",
    marginBottom: 10,
  },
  primaryButton: {
    padding: 14,
    borderRadius: 14,
    background:
      "linear-gradient(135deg,#d4af37,#facc15)",
    border: "none",
    fontWeight: 600,
  },
  progressBg: {
    height: 10,
    background: "#1f2937",
    borderRadius: 8,
    marginTop: 6,
  },
  progressFill: {
    height: "100%",
    background:
      "linear-gradient(135deg,#d4af37,#facc15)",
    borderRadius: 8,
  },
  progressText: {
    fontSize: 12,
    marginTop: 6,
    color: "#9ca3af",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    background: "#1f2937",
    marginBottom: 8,
  },
  rowLeft: {
    fontSize: 14,
  },
  rowRight: {
    fontWeight: 600,
  },
};

