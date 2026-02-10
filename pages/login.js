import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status]);

  if (status === "loading") return null;

  return (
    <div style={styles.page}>
      <h1>Sign In</h1>

      <button onClick={() => signIn("google")} style={styles.button}>
        Sign in with Google
      </button>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial",
    background: "#f5f7fb"
  },
  button: {
    padding: "12px 24px",
    borderRadius: 8,
    border: "none",
    background: "#4285F4",
    color: "#fff",
    fontSize: 16,
    cursor: "pointer"
  }
};

