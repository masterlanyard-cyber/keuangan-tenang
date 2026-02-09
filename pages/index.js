import { useState, useEffect } from "react";

function rupiah(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

export default function Home() {
  const [saldo, setSaldo] = useState(0);
  const [jumlah, setJumlah] = useState("");
  const [riwayat, setRiwayat] = useState([]);

  useEffect(() => {
    const savedSaldo = localStorage.getItem("saldo");
    const savedRiwayat = localStorage.getItem("riwayat");

    if (savedSaldo !== null) setSaldo(Number(savedSaldo));
    if (savedRiwayat !== null) setRiwayat(JSON.parse(savedRiwayat));
  }, []);

  useEffect(() => {
    localStorage.setItem("saldo", saldo);
    localStorage.setItem("riwayat", JSON.stringify(riwayat));
  }, [saldo, riwayat]);

  function tambahIncome() {
    const nilai = Number(jumlah);
    if (!nilai) return;

    setSaldo(saldo + nilai);
    setRiwayat([
      { type: "Income", amount: nilai, time: new Date().toLocaleString() },
      ...riwayat
    ]);
    setJumlah("");
  }

  function tambahExpense() {
    const nilai = Number(jumlah);
    if (!nilai) return;

    setSaldo(saldo - nilai);
    setRiwayat([
      { type: "Expense", amount: nilai, time: new Date().toLocaleString() },
      ...riwayat
    ]);
    setJumlah("");
  }

  function resetData() {
    if (!confirm("Yakin ingin menghapus semua data?")) return;
    setSaldo(0);
    setRiwayat([]);
    localStorage.removeItem("saldo");
    localStorage.removeItem("riwayat");
  }

  function exportCSV() {
    if (riwayat.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    const header = ["Tanggal", "Tipe", "Nominal"];
    const rows = riwayat.map(item => [
      item.time,
      item.type,
      item.amount
    ]);

    const csv =
      [header, ...rows].map(r => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "riwayat_keuangan.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  // === LAPORAN ===
  const totalIncome = riwayat
    .filter(r => r.type === "Income")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = riwayat
    .filter(r => r.type === "Expense")
    .reduce((sum, r) => sum + r.amount, 0);

  const net = totalIncome - totalExpense;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Dashboard Keuangan</h1>

      {/* SALDO */}
      <div style={styles.card}>
        <div style={styles.label}>Saldo Saat Ini</div>
        <div style={styles.saldo}>{rupiah(saldo)}</div>
      </div>

      {/* LAPORAN */}
      <div style={styles.report}>
        <div style={styles.reportCard}>
          <div>Total Income</div>
          <strong style={{ color: "#2ecc71" }}>
            {rupiah(totalIncome)}
          </strong>
        </div>
        <div style={styles.reportCard}>
          <div>Total Expense</div>
          <strong style={{ color: "#e74c3c" }}>
            {rupiah(totalExpense)}
          </strong>
        </div>
        <div style={styles.reportCard}>
          <div>Net</div>
          <strong>
            {rupiah(net)}
          </strong>
        </div>
      </div>

      {/* INPUT */}
      <div style={styles.inputBox}>
        <input
          type="number"
          value={jumlah}
          onChange={(e) => setJumlah(e.target.value)}
          placeholder="Masukkan nominal"
          style={styles.input}
        />
        <button onClick={tambahIncome} style={styles.incomeBtn}>
          + Income
        </button>
        <button onClick={tambahExpense} style={styles.expenseBtn}>
          - Expense
        </button>
      </div>

      {/* ACTION */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={exportCSV} style={styles.exportBtn}>
          Export CSV
        </button>
        <button onClick={resetData} style={styles.resetBtn}>
          Reset Data
        </button>
      </div>

      {/* RIWAYAT */}
      <div style={styles.card}>
        <h3>Riwayat Transaksi</h3>

        {riwayat.length === 0 && <p>Belum ada transaksi</p>}

        <ul style={styles.list}>
          {riwayat.map((item, index) => (
            <li key={index} style={styles.listItem}>
              <span>
                <strong
                  style={{
                    color:
                      item.type === "Income" ? "#2ecc71" : "#e74c3c"
                  }}
                >
                  {item.type}
                </strong>{" "}
                {rupiah(item.amount)}
              </span>
              <span style={styles.time}>{item.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: 32,
    maxWidth: 700,
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
    background: "#f5f7fb",
    minHeight: "100vh"
  },
  title: {
    marginBottom: 20
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 6px 16px rgba(0,0,0,0.06)"
  },
  label: {
    fontSize: 14,
    color: "#666"
  },
  saldo: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 8
  },
  report: {
    display: "flex",
    gap: 12,
    marginBottom: 20
  },
  reportCard: {
    flex: 1,
    background: "#fff",
    borderRadius: 10,
    padding: 16,
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
  },
  inputBox: {
    display: "flex",
    gap: 10,
    marginBottom: 10
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ccc"
  },
  incomeBtn: {
    background: "#2ecc71",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer"
  },
  expenseBtn: {
    background: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer"
  },
  exportBtn: {
    background: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
    marginRight: 8,
    cursor: "pointer"
  },
  resetBtn: {
    background: "#888",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer"
  },
  list: {
    listStyle: "none",
    padding: 0,
    marginTop: 12
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #eee"
  },
  time: {
    fontSize: 12,
    color: "#999"
  }
};

