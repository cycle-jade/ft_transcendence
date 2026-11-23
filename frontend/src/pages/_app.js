import "@/styles/globals.css";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { appWithTranslation } from "next-i18next";
import nextI18NextConfig from "../../next-i18next.config.js";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import api, { endpoints } from "@/lib/api";

// Calls POST /users/online every 60s while logged in.
// Backend marks user OFFLINE after 5 minutes of no pings.
function OnlineHeartbeat() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    // Ping immediately on mount
    api.post(endpoints.users.markOnline).catch(() => {});
    const interval = setInterval(() => {
      api.post(endpoints.users.markOnline).catch(() => {});
    }, 60_000); // every 60 seconds
    return () => clearInterval(interval);
  }, [user]);
  return null;
}

function App({ Component, pageProps }) {
  const sidebar = Component.sidebar ? Component.sidebar(pageProps) : null;

  return (
    <AuthProvider>
      <OnlineHeartbeat />
      <Layout sidebar={sidebar}>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}

export default appWithTranslation(App, nextI18NextConfig);
