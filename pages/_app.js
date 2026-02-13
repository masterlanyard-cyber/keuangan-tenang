import { SessionProvider } from "next-auth/react";

export default function App({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session}>
      <div style={S.app}>
        <Component {...pageProps} />
      </div>
    </SessionProvider>
  );
}

const S = {
  app: {
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    color: "#f9fafb",
  },
};

