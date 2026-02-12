import dynamic from "next/dynamic";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui';

const rupiah = n => "Rp " + Number(n || 0).toLocaleString("id-ID");
const CATEGORIES = ["Food","Transport","Housing","Utilities","Entertainment","Other"];

function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [saldo, setSaldo] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [savingGoal, setSavingGoal] = useState(0);
  const [investment, setInvestment] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [ym, setYm] = useState("");

  useEffect(() => {
    setYm(new Date().toISOString().slice(0,7));
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") return null;
  if (!session) return null;

  const key = `finance_${session.user.email}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(key);
    if (raw) {
      const d = JSON.parse(raw);
      setSaldo(d.saldo || 0);
      setTransactions(d.transactions || []);
      setSavingGoal(d.savingGoal || 0);
      setInvestment(d.investment || 0);
    }
    setHasLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem(
      key,
      JSON.stringify({ saldo, transactions, savingGoal, investment })
    );
  }, [saldo, transactions, savingGoal, investment, hasLoaded, key]);

  const monthly = useMemo(() => {
    let income = 0;
    let expense = 0;
    const byCategory = {};

    transactions.forEach(t => {
      if (!t.time.startsWith(ym)) return;
      if (t.type === "Income") income += t.amount;
      if (t.type === "Expense") {
        expense += t.amount;
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      }
    });

    return { income, expense, byCategory };
  }, [transactions, ym]);

  const pieData = {
    labels: Object.keys(monthly.byCategory),
    datasets: [{
      data: Object.values(monthly.byCategory),
      backgroundColor: ["#d4af37","#4ade80","#60a5fa","#f472b6","#f87171","#a78bfa"],
      borderWidth: 0
    }]
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0f1115", color:"#e5e7eb", padding:60, fontFamily: FONT }}>
      <h2>Executive Finance</h2>
      <div style={{ marginBottom:20 }}>{session.user.email}</div>
      <button onClick={()=>signOut()}>Logout</button>

      <div style={{ marginTop:40 }}>
        <h3>Net Worth</h3>
        <div style={{ fontSize:28 }}>
          {rupiah(saldo + investment)}
        </div>
      </div>

      <div style={{ marginTop:40 }}>
        <h3>Monthly Income</h3>
        <div>{rupiah(monthly.income)}</div>
        <h3>Monthly Expense</h3>
        <div>{rupiah(monthly.expense)}</div>
      </div>

      <div style={{ marginTop:40, maxWidth:360 }}>
        {pieData.labels.length > 0 && <Pie data={pieData} />}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(Home), { ssr: false });

