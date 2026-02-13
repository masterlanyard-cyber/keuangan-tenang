import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

export default function Dashboard({ userEmail }) {
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const raw = localStorage.getItem(`finance_${userEmail}`);
    if (raw) {
      setTransactions(JSON.parse(raw));
    }
  }, [mounted, userEmail]);

  if (!mounted) return null;

  return (
    <div style={{ padding: 40 }}>
      <h2>Executive Finance</h2>
      <div>{userEmail}</div>
      <button onClick={() => signOut()}>Logout</button>

      <div style={{ marginTop: 30 }}>
        Total Transactions: {transactions.length}
      </div>
    </div>
  );
}

