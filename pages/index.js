import dynamic from "next/dynamic";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      router.replace("/login");
    }
  }, [mounted, status, router]);

  if (!mounted) return null;
  if (status === "loading") return null;
  if (!session) return null;

  return (
    <div style={{ padding: 40 }}>
      <h2>Executive Finance</h2>
      <div>{session.user.email}</div>
      <button onClick={() => signOut()}>Logout</button>
      <div style={{ marginTop: 30 }}>
        Dashboard loaded successfully.
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(Home), { ssr: false });

