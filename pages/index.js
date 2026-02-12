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

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [saldo, setSaldo] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [savingGoal, setSavingGoal] = useState(0);
  const [investment, setInvestment] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);

  // input
  const [showInput, setShowInput] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [type, setType] = useState("Expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));

  // filter
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (!session) return null;

  const key = `finance_${session.user.email}`;

  // LOAD
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

  // SAVE
  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem(
      key,
      JSON.stringify({ saldo, transactions, savingGoal, investment })
    );
  }, [saldo, transactions, savingGoal, investment, hasLoaded, key]);

  function recalc(list){
    let s = 0;
    list.forEach(t => {
      s += t.type === "Income" ? t.amount : -t.amount;
    });
    setSaldo(s);
  }

  function saveTx(){
    const n = Number(amount);
    if (!n) return;

    let finalType = type;
    let finalCategory = category;
    if (type === "Salary") {
      finalType = "Income";
      finalCategory = "Salary";
    }

    const tx = {
      id: editTx?.id || crypto.randomUUID(),
      type: finalType,
      source: type,
      category: finalCategory,
      amount: n,
      description: desc,
      time: new Date(date).toISOString()
    };

    const updated = editTx
      ? transactions.map(t => t.id === editTx.id ? tx : t)
      : [tx, ...transactions];

    setTransactions(updated);
    recalc(updated);
    resetForm();
  }

  function resetForm(){
    setShowInput(false);
    setEditTx(null);
    setType("Expense");
    setAmount("");
    setCategory("Food");
    setDesc("");
    setDate(new Date().toISOString().slice(0,10));
  }

  function removeTx(id){
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    recalc(updated);
  }

  const filtered = transactions.filter(t => {
    const d = t.time.slice(0,10);
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  });

  // ===== DASHBOARD =====
  const [ym, setYm] = useState("");

useEffect(() => {
  setYm(new Date().toISOString().slice(0,7));
}, []);

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

  const savingProgress =
    savingGoal > 0 ? Math.min((saldo / savingGoal) * 100, 100) : 0;

  // ===== AI INSIGHT (LEMBUT) =====
  const aiInsight = useMemo(() => {
    if (transactions.length === 0) {
      return "Anda belum memiliki data transaksi. Mulailah mencatat secara perlahan untuk mendapatkan insight keuangan yang lebih personal.";
    }

    let msg = [];
    if (monthly.income > monthly.expense) {
      msg.push("Secara umum kondisi keuangan Anda bulan ini tergolong stabil, karena pemasukan masih lebih besar daripada pengeluaran.");
    } else if (monthly.income < monthly.expense) {
      msg.push("Bulan ini pengeluaran Anda sedikit lebih besar dari pemasukan. Tidak perlu khawatir, ini bisa diperbaiki secara bertahap.");
    } else {
      msg.push("Pemasukan dan pengeluaran Anda bulan ini berada di titik seimbang.");
    }

    const topCategory = Object.entries(monthly.byCategory)
      .sort((a,b)=>b[1]-a[1])[0];

    if (topCategory) {
      msg.push(
        `Pengeluaran terbesar Anda berada di kategori ${topCategory[0]}. Mengurangi sedikit dari kategori ini bisa memberi ruang lebih untuk menabung.`
      );
    }

    if (savingGoal > 0) {
      if (savingProgress >= 100) {
        msg.push("Selamat! Target saving Anda telah tercapai. Anda bisa mempertimbangkan target baru atau mulai fokus ke investasi.");
      } else {
        msg.push(`Progress saving Anda saat ini sekitar ${savingProgress.toFixed(1)}%. Konsistensi kecil setiap bulan sudah sangat membantu.`);
      }
    }

    return msg.join(" ");
  }, [transactions, monthly, savingGoal, savingProgress]);

  return (
    <div style={{ ...S.page, fontFamily: FONT }}>
      {/* HEADER */}
      <header style={S.header}>
        <div>
          <div style={S.brand}>EXECUTIVE FINANCE</div>
          <div style={S.email}>{session.user.email}</div>
        </div>
        <div>
          <button style={S.addBtn} onClick={()=>setShowInput(true)}>＋ Add</button>
          <button style={S.logout} onClick={()=>signOut()}>Logout</button>
        </div>
      </header>

      {/* NET WORTH */}
      <section style={S.hero}>
        <div style={S.label}>Net Worth</div>
        <div style={S.heroValue}>{rupiah(saldo + investment)}</div>
        <div style={S.subtle}>
          Cash {rupiah(saldo)} · Investment {rupiah(investment)}
        </div>
      </section>

      {/* SUMMARY */}
      <section style={S.grid}>
        <div style={S.card}>
          <div style={S.label}>Monthly Income</div>
          <div style={{ ...S.value, color:"#22c55e" }}>{rupiah(monthly.income)}</div>
        </div>
        <div style={S.card}>
          <div style={S.label}>Monthly Expense</div>
          <div style={{ ...S.value, color:"#ef4444" }}>{rupiah(monthly.expense)}</div>
        </div>
        <div style={S.card}>
          <div style={S.label}>Net Cashflow</div>
          <div style={S.value}>{rupiah(monthly.income - monthly.expense)}</div>
        </div>
      </section>

      {/* AI INSIGHT */}
      <section style={S.cardWide}>
        <div style={S.label}>AI Financial Insight</div>
        <div style={S.aiText}>{aiInsight}</div>
      </section>

      {/* SAVING */}
      <section style={S.card}>
        <div style={S.label}>Saving Goal</div>
        <input
          type="number"
          placeholder="Target Saving"
          value={savingGoal}
          onChange={e=>setSavingGoal(Number(e.target.value))}
          style={S.input}
        />
        <div style={S.progressBg}>
          <div style={{ ...S.progressFill, width: `${savingProgress}%` }} />
        </div>
        <div style={S.muted}>
          {savingProgress.toFixed(1)}% · Target {rupiah(savingGoal)}
        </div>
      </section>

      {/* INVESTMENT */}
      <section style={S.card}>
        <div style={S.label}>Investment</div>
        <input
          type="number"
          placeholder="Total Investment"
          value={investment}
          onChange={e=>setInvestment(Number(e.target.value))}
          style={S.input}
        />
      </section>

      {/* PIE */}
      <section style={S.cardWide}>
        <div style={S.label}>Spending Distribution</div>
        {pieData.labels.length === 0
          ? <div style={S.muted}>No expense this month</div>
          : <div style={{maxWidth:360}}><Pie data={pieData}/></div>}
      </section>

      {/* FILTER */}
      <section style={S.card}>
        <div style={S.label}>Filter Tanggal</div>
        <div style={{display:"flex",gap:12}}>
          <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={S.input}/>
          <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={S.input}/>
        </div>
      </section>

      {/* LIST */}
      <section style={S.card}>
        <div style={S.label}>Riwayat Transaksi</div>
        {filtered.length === 0 && <div style={S.muted}>Tidak ada data</div>}
        {filtered.map(t=>(
          <div key={t.id} style={S.row}>
            <div>
              <div style={S.date}>{t.time.slice(0,10)}</div>
              <div>{t.category}</div>
              {t.description && <div style={S.desc}>{t.description}</div>}
            </div>
            <div style={{color:t.type==="Income"?"#22c55e":"#ef4444"}}>
              {t.type==="Income"?"+":"-"}{rupiah(t.amount)}
            </div>
            <div>
              <button onClick={()=>{
                setEditTx(t);
                setShowInput(true);
                setType(t.source);
                setAmount(t.amount);
                setCategory(t.category);
                setDesc(t.description||"");
                setDate(t.time.slice(0,10));
              }}>✏️</button>
              <button onClick={()=>removeTx(t.id)}>🗑</button>
            </div>
          </div>
        ))}
      </section>

      {/* MODAL */}
      {showInput && (
        <div style={S.modalBg}>
          <div style={S.modal}>
            <div style={S.modalTitle}>{editTx?"Edit":"Add"} Transaction</div>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={S.input}/>
            <select value={type} onChange={e=>setType(e.target.value)} style={S.input}>
              <option>Expense</option>
              <option>Income</option>
              <option>Salary</option>
            </select>
            <input type="number" placeholder="Amount" value={amount}
              onChange={e=>setAmount(e.target.value)} style={S.input}/>
            {type==="Expense" && (
              <select value={category} onChange={e=>setCategory(e.target.value)} style={S.input}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            )}
            <input placeholder="Description / Remark" value={desc}
              onChange={e=>setDesc(e.target.value)} style={S.input}/>
            <button style={S.primaryBtn} onClick={saveTx}>Save</button>
            <button style={S.secondaryBtn} onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page:{minHeight:"100vh",background:"#0f1115",color:"#e5e7eb",padding:"64px 72px"},
  header:{display:"flex",justifyContent:"space-between",marginBottom:36},
  brand:{fontSize:22,fontWeight:600,letterSpacing:1.5},
  email:{fontSize:12,color:"#9ca3af",marginTop:6},
  addBtn:{background:"#d4af37",border:"none",borderRadius:10,padding:"10px 16px"},
  logout:{marginLeft:10,background:"#1f2933",color:"#e5e7eb",border:"1px solid #374151",borderRadius:10,padding:"10px 16px"},
  hero:{background:"linear-gradient(135deg,#0b1220,#0f1a2e)",borderRadius:28,padding:36,marginBottom:36},
  heroValue:{fontSize:40,fontWeight:700},
  subtle:{fontSize:12,color:"#9ca3af",marginTop:6},
  grid:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24,marginBottom:36},
  card:{background:"#111827",borderRadius:24,padding:28,marginBottom:28},
  cardWide:{background:"#111827",borderRadius:24,padding:28,marginBottom:28},
  label:{fontSize:13,color:"#9ca3af",marginBottom:6},
  value:{fontSize:28,fontWeight:600},
  muted:{fontSize:13,color:"#9ca3af"},
  row:{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid #1f2933"},
  date:{fontSize:12,color:"#9ca3af"},
  desc:{fontSize:12,color:"#9ca3af",marginTop:4},
  input:{width:"100%",padding:10,marginBottom:10,background:"#0f172a",color:"#e5e7eb",border:"1px solid #374151",borderRadius:8},
  progressBg:{width:"100%",height:10,background:"#1f2933",borderRadius:6,overflow:"hidden",margin:"10px 0"},
  progressFill:{height:"100%",background:"#d4af37"},
  aiText:{fontSize:14,lineHeight:1.7,color:"#e5e7eb"},
  modalBg:{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center"},
  modal:{background:"#111827",borderRadius:16,padding:24,width:360},
  modalTitle:{fontWeight:600,marginBottom:12},
  primaryBtn:{background:"#d4af37",border:"none",borderRadius:8,padding:10,width:"100%"},
  secondaryBtn:{marginTop:6,width:"100%",background:"#1f2933",color:"#e5e7eb",border:"none",borderRadius:8,padding:10}
};

