import { getSession } from "next-auth/react";
import dynamic from "next/dynamic";

const Dashboard = dynamic(() => import("../components/Dashboard"), {
  ssr: false,
});

export default function Home({ userEmail }) {
  return <Dashboard userEmail={userEmail} />;
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

