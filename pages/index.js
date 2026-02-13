import { getSession, useSession, signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const rupiah = n => "Rp " + Number(n || 0).toLocaleString("id-ID");

export default function Home({ userEmail }) {
  const { data: session } = useSession();

  const [transactions, setTransactions] = useState([]);
  const [ym, setYm] = useState("");

  useEffect(() => {
    setYm(new Date().toISOString().slice(0,7));
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    const raw = localStorage.getItem(`finance_${userEmail}`);
    if (raw) {
      setTransactions(JSON.parse(raw));
    }
  }, [userEmail]);

  const monthly = useMemo(() => {
    let total = 0;
    transactions.forEach(t => {
      if (t.time?.startsWith(ym)) {
        total += t.amount;
      }
    });
    return total;
  }, [transactions, ym]);

  return (
    <div style={{ padding:40 }}>
      <h2>Executive Finance</h2>
      <div>{userEmail}</div>
      <button onClick={()=>signOut()}>Logout</button>
      <div style={{ marginTop:30 }}>
        Monthly Total: {rupiah(monthly)}
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      userEmail: session.user.email,
    },
  };
}

